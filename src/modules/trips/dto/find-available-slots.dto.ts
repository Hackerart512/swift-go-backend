/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  IsDateString,
  IsNotEmpty,
  IsEnum,
  IsUUID,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer'; // For transforming query params

export enum TimeOfDay {
  AM = 'AM',
  PM = 'PM',
}

export class FindAvailableSlotsDto {
  @ApiProperty({ description: 'Date of travel (YYYY-MM-DD)', example: '2024-06-01' })
  @IsDateString()
  @IsNotEmpty()
  date: string; // YYYY-MM-DD

  @ApiProperty({ description: 'Time period (AM/PM)', enum: TimeOfDay, example: TimeOfDay.AM })
  @IsEnum(TimeOfDay)
  @IsNotEmpty()
  timePeriod: TimeOfDay;

  @ApiProperty({ description: 'Origin stop ID', example: 'stop-uuid-1' })
  @IsUUID()
  @IsNotEmpty()
  originStopId: string;

  @ApiProperty({ description: 'Destination stop ID', example: 'stop-uuid-2' })
  @IsUUID()
  @IsNotEmpty()
  destinationStopId: string;

  @ApiProperty({ description: 'Route ID (optional)', example: 'route-uuid-1', required: false })
  @IsOptional()
  @IsUUID()
  routeId?: string; // Optional: if user already selected a general route
}
