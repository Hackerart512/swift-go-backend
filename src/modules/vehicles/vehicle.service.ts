// src/modules/vehicles/vehicles.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity'; // Ensure VehicleStatus is exported
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleTypesService } from './vehicle-types.service'; // To validate vehicleTypeId and get capacity
import { VehicleType } from './entities/vehicle-type.entity'; // For type hinting

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    private readonly vehicleTypesService: VehicleTypesService, // Injected
  ) {}

  async create(createDto: CreateVehicleDto): Promise<Vehicle> {
    const existingByRegNo = await this.vehicleRepository.findOneBy({
      registrationNumber: createDto.registrationNumber,
    });
    if (existingByRegNo) {
      throw new ConflictException(
        `Vehicle with registration number ${createDto.registrationNumber} already exists.`,
      );
    }

    // Fetch and validate the vehicleType
    const vehicleType = await this.vehicleTypesService.findOne(
      createDto.vehicleTypeId,
    );
    if (!vehicleType.isActive) {
      throw new BadRequestException(
        `Vehicle type "${vehicleType.name}" is not active.`,
      );
    }

    // Validate actualPassengerCapacity against the chosen vehicleType's passengerCapacity
    if (
      createDto.actualPassengerCapacity &&
      createDto.actualPassengerCapacity > vehicleType.passengerCapacity
    ) {
      throw new BadRequestException(
        `Actual passenger capacity (${createDto.actualPassengerCapacity}) cannot exceed the capacity of vehicle type "${vehicleType.name}" (${vehicleType.passengerCapacity}).`,
      );
    }

    const vehicleToCreate: Partial<Vehicle> = {
      ...createDto,
      // TypeORM will handle setting vehicleTypeId from the relation if vehicleType object is passed
      // but it's safer to ensure vehicleTypeId string is also on the DTO and entity.
      // The vehicleType object itself is already fetched and available.
      vehicleType: vehicleType, // Assign the full entity for the relation
    };

    const vehicleEntity = this.vehicleRepository.create(vehicleToCreate);
    return this.vehicleRepository.save(vehicleEntity);
  }

  async findAll(): Promise<Vehicle[]> {
    // vehicleType is eager-loaded from Vehicle entity definition
    return this.vehicleRepository.find({
      order: { registrationNumber: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Vehicle | null> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
      // relations: ['vehicleType'], // Not needed if eager:true in Vehicle entity
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found.`);
    }
    return vehicle;
  }

  async update(id: string, updateDto: UpdateVehicleDto): Promise<Vehicle> {
    // Fetch the vehicle to update, ensuring it exists
    const vehicleToUpdate = await this.findOne(id);

    if (
      updateDto.registrationNumber &&
      vehicleToUpdate &&
      updateDto.registrationNumber !== vehicleToUpdate.registrationNumber
    ) {
      const existingReg = await this.vehicleRepository.findOneBy({
        registrationNumber: updateDto.registrationNumber,
      });
      if (existingReg && existingReg.id !== id) {
        throw new ConflictException(
          `Another vehicle with registration number ${updateDto.registrationNumber} already exists.`,
        );
      }
    }

    let typeForCapacityCheck: VehicleType = vehicleToUpdate!.vehicleType;
    if (
      updateDto.vehicleTypeId &&
      updateDto.vehicleTypeId !== vehicleToUpdate?.vehicleTypeId
    ) {
      // If vehicleTypeId is being changed, fetch the new vehicleType to validate capacity
      typeForCapacityCheck = await this.vehicleTypesService.findOne(
        updateDto.vehicleTypeId,
      );
      if (!typeForCapacityCheck.isActive) {
        throw new BadRequestException(
          `Cannot assign to inactive vehicle type "${typeForCapacityCheck.name}".`,
        );
      }
    }

    // Validate actualPassengerCapacity against the (potentially new) vehicleType's passengerCapacity
    const capacityToValidateAgainst =
      updateDto.actualPassengerCapacity !== undefined
        ? updateDto.actualPassengerCapacity
        : vehicleToUpdate!.actualPassengerCapacity; // If not updating actual, use existing actual

    if (
      capacityToValidateAgainst &&
      capacityToValidateAgainst > typeForCapacityCheck.passengerCapacity
    ) {
      throw new BadRequestException(
        `Actual passenger capacity (${capacityToValidateAgainst}) cannot exceed the capacity of vehicle type "${typeForCapacityCheck.name}" (${typeForCapacityCheck.passengerCapacity}).`,
      );
    }

    // Preload works well for merging partial updates into an existing entity
    const preloadedVehicle = await this.vehicleRepository.preload({
      id: id, // Key to find existing entity
      ...updateDto, // Apply updates from DTO
    });

    if (!preloadedVehicle) {
      // This should not happen if findOne(id) above succeeded.
      throw new NotFoundException(
        `Vehicle with ID ${id} not found for preloading.`,
      );
    }

    // If vehicleTypeId was part of updateDto, assign the fetched vehicleType entity to the relation
    if (updateDto.vehicleTypeId) {
      preloadedVehicle.vehicleType = typeForCapacityCheck;
    }

    return this.vehicleRepository.save(preloadedVehicle);
  }

  async remove(id: string): Promise<void> {
    // TODO: Add logic to check if the vehicle is assigned to any active or upcoming scheduled trips.
    // If so, either prevent deletion, or handle unassigning/cancelling those trips.
    // For now, direct delete:
    const result = await this.vehicleRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Vehicle with ID ${id} not found.`);
    }
  }
}
