import { ApiProperty } from '@nestjs/swagger';

export enum SeatStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked', // Generic booked if gender not specified/other
  RESERVED_MALE = 'reserved_male',
  RESERVED_FEMALE = 'reserved_female',
  UNAVAILABLE = 'unavailable', // Not bookable (e.g., driver)
  BLOCKED = 'blocked', // Admin blocked
}

export interface UiSeat {
  seatId: string;
  seatNumber: string; // Display number
  description: string;
  status: SeatStatus;
  isBookable: boolean;
  type?: 'window' | 'aisle' | 'middle'; // From VehicleType.simpleSeatIdentifiers if defined
}

export class TripSeatLayoutDto {
  @ApiProperty({ description: 'Scheduled trip ID', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  scheduledTripId: string;

  @ApiProperty({ description: 'Total number of passenger seats', example: 40 })
  totalPassengerSeats: number;

  @ApiProperty({ description: 'Current available seats', example: 10 })
  currentAvailableSeats: number; // From ScheduledTrip.currentAvailableSeats

  @ApiProperty({ description: 'Seat layout array', type: 'array', items: { type: 'object' }, example: [{ seatId: '1A', seatNumber: '1', description: 'Window seat', status: 'available', isBookable: true }] })
  seats: UiSeat[];
}
