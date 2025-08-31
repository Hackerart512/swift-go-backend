import { PartialType } from '@nestjs/mapped-types';
import { CreateScheduledTripDto } from './create-scheduled-trip.dto';
import { IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class UpdateScheduledTripDto extends PartialType(
  CreateScheduledTripDto,
) {
  // Allow updating currentAvailableSeats directly by admin if needed (e.g. manual adjustment)
  @ApiProperty({ description: 'Current available seats (manual admin adjustment)', example: 5, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  currentAvailableSeats?: number;
}
