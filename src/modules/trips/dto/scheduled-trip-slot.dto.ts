import { ScheduledTrip } from '../entities/scheduled-trip.entity';
import { RouteStop } from '../../routes/entities/route-stop.entity';
import { differenceInMinutes } from 'date-fns';
import { ApiProperty } from '@nestjs/swagger';

export class ScheduledTripSlotDto {
  @ApiProperty({ description: 'Scheduled trip ID', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  scheduledTripId: string;

  @ApiProperty({ description: 'Route name', example: 'Downtown to Airport' })
  routeName: string;

  @ApiProperty({ description: 'Pickup stop ID', example: 'stop-uuid-1' })
  pickupStopId: string;

  @ApiProperty({ description: 'Destination stop ID', example: 'stop-uuid-2' })
  destinationStopId: string;

  @ApiProperty({ description: 'Pickup location name', example: 'Downtown' })
  pickupLocationName: string;

  @ApiProperty({ description: 'Destination location name', example: 'Airport' })
  destinationLocationName: string;

  @ApiProperty({ description: 'Departure date and time (ISO 8601)', example: '2024-06-01T08:00:00Z' })
  departureDateTime: string;

  @ApiProperty({ description: 'Estimated arrival date and time (ISO 8601)', example: '2024-06-01T10:00:00Z' })
  estimatedArrivalDateTime: string;

  @ApiProperty({ description: 'Duration text', example: '2h 0min', required: false })
  durationText?: string;

  @ApiProperty({ description: 'Price per seat', example: 250 })
  price: number;

  @ApiProperty({ description: 'Currency', example: 'INR' })
  currency: string;

  @ApiProperty({ description: 'Number of available seats', example: 3 })
  availableSeats: number;

  @ApiProperty({ description: 'Vehicle information', example: { type: 'Sedan', model: 'Swift', registrationNumber: 'AB12CD3456' }, required: false })
  vehicleInfo?: { type: string; model?: string; registrationNumber?: string };

  constructor(trip: ScheduledTrip, originStop: RouteStop, destinationStop: RouteStop) {
    this.scheduledTripId = trip.id;
    this.routeName = trip.route.name;

    // --- Add the UUIDs to the DTO ---
    this.pickupStopId = originStop.id;
    this.destinationStopId = destinationStop.id;

    // Set the names as before
    this.pickupLocationName = originStop.name;
    this.destinationLocationName = destinationStop.name;

    this.departureDateTime = trip.departureDateTime.toISOString();
    this.estimatedArrivalDateTime = trip.estimatedArrivalDateTime.toISOString();

    const durationMinutes = differenceInMinutes(trip.estimatedArrivalDateTime, trip.departureDateTime);
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    this.durationText = `${hours > 0 ? hours + 'h ' : ''}${minutes}min`;

    this.price = Number(trip.pricePerSeat);
    this.currency = trip.currency;
    this.availableSeats = trip.currentAvailableSeats;
    if (trip.vehicle) {
      this.vehicleInfo = {
        type: trip.vehicle.vehicleType.name,
        model: trip.vehicle.modelName,
        registrationNumber: trip.vehicle.registrationNumber,
      };
    }
  }
}
