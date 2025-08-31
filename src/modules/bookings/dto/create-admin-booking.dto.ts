// src/modules/bookings/dto/create-admin-booking.dto.ts
import { IsUUID, IsInt, Min } from 'class-validator';

export class CreateAdminBookingDto {
  @IsUUID()
  tripId: string;

  @IsUUID()
  userId: string; // The ID of the user we are booking for

  @IsUUID()
  pickupStopId: string;

  @IsUUID()
  dropoffStopId: string;

  @IsInt()
  @Min(1)
  seatCount: number;
}