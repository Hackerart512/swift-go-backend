// src/modules/bookings/dto/passenger-for-trip.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Booking } from '../entities/booking.entity';

export class PassengerForTripDto {
  @ApiProperty({ description: 'The unique ID of the booking.' })
  bookingId: string;

  @ApiProperty({ description: 'The full name of the passenger.', example: 'Ronnie Frank' })
  passengerName: string;

  @ApiProperty({ description: 'The URL of the passenger\'s profile picture.', required: false })
  passengerProfilePhotoUrl?: string;

  @ApiProperty({ description: 'The number of seats this passenger has booked.', example: 1 })
  numberOfSeats: number;

  @ApiProperty({ description: 'The name of the passenger\'s designated pickup stop.', example: '311 Nitzsche Points Suite 259' })
  pickupStopName: string;

  @ApiProperty({ description: 'The OTP the driver will use to confirm boarding.', example: '123456' })
  boardingOtp: string;

  @ApiProperty({ 
    description: 'The geographic coordinates of the pickup location.',
    example: { latitude: 40.71427, longitude: -74.00597 }
  })
  pickupLocation: { latitude: number, longitude: number };

  constructor(booking: Booking) {
    this.bookingId = booking.id;
    this.passengerName = booking.user?.fullName || 'N/A';
    this.passengerProfilePhotoUrl = booking.user?.profilePhotoUrl;
    this.numberOfSeats = booking.numberOfSeatsBooked;
    this.pickupStopName = booking.pickupStop?.name || 'N/A';
    this.boardingOtp = booking.boardingOtp || 'N/A';

    // --- THIS IS THE FIX ---
    // Safely access the coordinates from the 'location' object.
    // The longitude is the first element (index 0) and latitude is the second (index 1).
    const coordinates = booking.pickupStop?.location?.coordinates;
    this.pickupLocation = {
      // Provide a default latitude if coordinates are missing
      latitude: coordinates ? coordinates[1] : 0, 
      // Provide a default longitude if coordinates are missing
      longitude: coordinates ? coordinates[0] : 0,
    };
    // --- END OF FIX ---
  }
}