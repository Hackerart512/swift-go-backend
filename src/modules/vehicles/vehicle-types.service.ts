// src/modules/vehicles/vehicle-types.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleType, SimpleCarSeat } from './entities/vehicle-type.entity'; // Ensure SimpleCarSeat is exported or defined here
import { CreateVehicleTypeDto } from './dto/create-vehicle-type.dto';
import { UpdateVehicleTypeDto } from './dto/update-vehicle-type.dto';
// Assuming Vehicle entity is defined to check for usage, if needed for delete validation
// import { Vehicle } from './entities/vehicle.entity';

@Injectable()
export class VehicleTypesService {
  constructor(
    @InjectRepository(VehicleType)
    private readonly vehicleTypeRepository: Repository<VehicleType>,
    // @InjectRepository(Vehicle) // Inject if you need to check vehicle usage before deleting a type
    // private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

  private validateSeatIdentifiersAgainstCapacity(
    passengerCapacity: number,
    simpleSeatIdentifiers?: SimpleCarSeat[], // DTOs use SimpleCarSeatDto, entity uses SimpleCarSeat
  ): void {
    if (simpleSeatIdentifiers && simpleSeatIdentifiers.length > 0) {
      const bookableSeatsCount = simpleSeatIdentifiers.filter(
        (seat) => seat.isBookable === true,
      ).length;
      if (bookableSeatsCount !== passengerCapacity) {
        throw new BadRequestException(
          `Declared passengerCapacity (${passengerCapacity}) must match the number of 'isBookable:true' seats in simpleSeatIdentifiers (${bookableSeatsCount}).`,
        );
      }
    }
    // If simpleSeatIdentifiers is not provided, we don't validate against it,
    // assuming the client will infer layout or it's not strictly enforced by this DTO.
    // However, for consistency, you might want to always require simpleSeatIdentifiers if passengerCapacity > 0
  }

  async create(createDto: CreateVehicleTypeDto): Promise<VehicleType> {
    const existing = await this.vehicleTypeRepository.findOneBy({
      name: createDto.name,
    });
    if (existing) {
      throw new ConflictException(
        `Vehicle type with name "${createDto.name}" already exists.`,
      );
    }

    this.validateSeatIdentifiersAgainstCapacity(
      createDto.passengerCapacity,
      createDto.simpleSeatIdentifiers as SimpleCarSeat[],
    );

    const vehicleType = this.vehicleTypeRepository.create(createDto);
    return this.vehicleTypeRepository.save(vehicleType);
  }

  async findAll(): Promise<VehicleType[]> {
    return this.vehicleTypeRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<VehicleType> {
    const vehicleType = await this.vehicleTypeRepository.findOneBy({ id });
    if (!vehicleType) {
      throw new NotFoundException(`Vehicle type with ID ${id} not found.`);
    }
    return vehicleType;
  }

  async update(
    id: string,
    updateDto: UpdateVehicleTypeDto,
  ): Promise<VehicleType> {
    const vehicleTypeToUpdate = await this.findOne(id); // Ensures type exists

    if (updateDto.name && updateDto.name !== vehicleTypeToUpdate.name) {
      const existingName = await this.vehicleTypeRepository.findOneBy({
        name: updateDto.name,
      });
      if (existingName && existingName.id !== id) {
        throw new ConflictException(
          `Another vehicle type with this name "${updateDto.name}" already exists.`,
        );
      }
    }

    // Determine capacity to validate against: use DTO's if provided, else existing.
    const capacityToValidate =
      updateDto.passengerCapacity !== undefined
        ? updateDto.passengerCapacity
        : vehicleTypeToUpdate.passengerCapacity;

    // Determine seat identifiers to validate against: use DTO's if provided, else existing.
    const seatsToValidate =
      updateDto.simpleSeatIdentifiers !== undefined
        ? (updateDto.simpleSeatIdentifiers as SimpleCarSeat[])
        : vehicleTypeToUpdate.simpleSeatIdentifiers;

    // Only validate if passengerCapacity OR simpleSeatIdentifiers is being explicitly updated
    if (
      updateDto.passengerCapacity !== undefined ||
      updateDto.simpleSeatIdentifiers !== undefined
    ) {
      this.validateSeatIdentifiersAgainstCapacity(
        capacityToValidate,
        seatsToValidate,
      );
    }

    // Preload merges DTO into a new entity fetched from DB, good for partial updates
    const updatedVehicleType = await this.vehicleTypeRepository.preload({
      id: id,
      ...updateDto,
    });

    if (!updatedVehicleType) {
      // This should ideally not happen if findOne(id) succeeded earlier
      throw new NotFoundException(
        `Vehicle type with ID ${id} could not be preloaded for update.`,
      );
    }

    return this.vehicleTypeRepository.save(updatedVehicleType);
  }

  async remove(id: string): Promise<void> {
    // Optional: Check if any vehicles are currently using this vehicle type.
    // const count = await this.vehicleRepository.count({ where: { vehicleTypeId: id } });
    // if (count > 0) {
    //   throw new ConflictException(`Cannot delete vehicle type with ID ${id} as it is currently assigned to ${count} vehicle(s).`);
    // }

    const result = await this.vehicleTypeRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Vehicle type with ID ${id} not found.`);
    }
  }
}
