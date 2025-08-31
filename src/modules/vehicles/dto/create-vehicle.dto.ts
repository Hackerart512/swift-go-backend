import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VehicleStatus } from '../entities/vehicle.entity';

export class CreateVehicleDto {
  @ApiProperty({
    description: 'Registration number of the vehicle',
    example: 'AB12CD3456',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  registrationNumber: string;

  @ApiProperty({
    description: 'Model name of the vehicle',
    example: 'Toyota Camry',
    required: false, // In Swagger, this is optional
  })
  @IsOptional() // In validation, this is optional
  @IsString()
  @MaxLength(100)
  modelName?: string;

  // --- ADDED THIS BLOCK ---
  @ApiProperty({
    description: 'Color of the vehicle',
    example: 'Blue',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;
  // -------------------------

  @ApiProperty({
    description: 'Vehicle type ID',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  vehicleTypeId: string;

  @ApiProperty({
    description: 'Actual passenger capacity, overrides the capacity from the vehicle type',
    example: 4,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  actualPassengerCapacity?: number;

  @ApiProperty({
    description: 'Status of the vehicle',
    enum: VehicleStatus,
    example: VehicleStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;
}