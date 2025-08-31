// src/modules/bookings/dto/update-booking.dto.ts
// --- NEW FILE ---

import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../entities/booking.entity';

export class UpdateBookingDto {
  @ApiProperty({
    description: 'The new status for the booking.',
    enum: BookingStatus,
    example: BookingStatus.CONFIRMED,
  })
  @IsNotEmpty()
  @IsEnum(BookingStatus)
  status: BookingStatus;
}