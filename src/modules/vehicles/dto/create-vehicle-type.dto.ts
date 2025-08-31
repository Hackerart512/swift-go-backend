// src/modules/vehicles/dto/create-vehicle-type.dto.ts

/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsBoolean,
  ValidateNested,
  IsArray,
  ArrayMinSize,
  MaxLength,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SimpleCarSeatDto } from './simple-car-seat.dto'; // Assuming this DTO exists

export class CreateVehicleTypeDto {
  @ApiProperty({ description: 'Name of the vehicle type', example: 'Sedan' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Description of the vehicle type',
    example: 'A comfortable 4-seater car',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Passenger capacity', example: 4 })
  @IsInt()
  @Min(1)
  @Max(10) // Cars usually don't exceed 10 passengers
  passengerCapacity: number;

  // --- ADDED a field based on the entity ---
  @ApiProperty({
    description: 'The transmission type of the vehicle',
    example: 'Automatic',
  })
  @IsString()
  @IsNotEmpty()
  transmissionType: string;

  // --- ADDED a field based on the entity ---
  @ApiProperty({
    description: 'The category of the vehicle',
    example: 'Comfort',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description: 'Simple seat identifiers',
    type: [SimpleCarSeatDto],
    required: false,
  })
  @IsOptional() // Make this optional; UI might infer standard layout
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SimpleCarSeatDto)
  simpleSeatIdentifiers?: SimpleCarSeatDto[];

  @ApiProperty({
    description: 'Whether the vehicle type is active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}