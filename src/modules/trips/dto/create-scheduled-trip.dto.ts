// src/modules/trips/dto/create-scheduled-trip.dto.ts
import {
  IsUUID,
  IsNotEmpty,
  IsDateString,
  IsNumber,
  Min,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsInt, // <-- IMPORTED
  Max,   // <-- IMPORTED
} from 'class-validator';
import { Type } from 'class-transformer'; // <-- IMPORTED
import { ApiProperty } from '@nestjs/swagger';
import { TripStatus } from '../entities/scheduled-trip.entity';

export class CreateScheduledTripDto {
  @ApiProperty({ description: 'Route ID for the trip', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @IsUUID()
  @IsNotEmpty()
  routeId: string;

  @ApiProperty({ description: 'Vehicle ID for the trip', example: 'b2c3d4e5-f6a1-2345-6789-0abcdef12345' })
  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;

  @ApiProperty({ description: 'Driver ID for the trip', example: 'c3d4e5f6-a1b2-3456-7890-abcdef123456' })
  @IsUUID()
  @IsNotEmpty()
  driverId: string;

  @ApiProperty({ description: 'Departure date and time (ISO 8601)', example: '2024-06-01T08:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  departureDateTime: string;

  @ApiProperty({ description: 'Estimated arrival date and time (ISO 8601)', example: '2024-06-01T10:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  estimatedArrivalDateTime: string;

  @ApiProperty({ description: 'Price per seat', example: 250 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  pricePerSeat: number;

  @ApiProperty({ description: 'Currency for the trip', example: 'INR', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  currency?: string = 'INR';

  @ApiProperty({ description: 'Status of the trip', enum: TripStatus, example: TripStatus.SCHEDULED, required: false })
  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus = TripStatus.SCHEDULED;

  @ApiProperty({ description: 'Whether the trip is active', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiProperty({ description: 'Additional notes for the trip', example: 'This is a non-smoking trip.', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  // --- NEW FIELD ADDED HERE ---
  @ApiProperty({
    description: 'Number of consecutive days to create this trip for. Defaults to 1.',
    example: 7,
    required: false,
    minimum: 1,
    maximum: 30,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  repeatDays?: number = 1;
}