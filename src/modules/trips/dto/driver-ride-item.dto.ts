// src/modules/trips/dto/driver-ride-item.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { format, differenceInMinutes } from 'date-fns';
import { RouteStop, StopType } from '../../routes/entities/route-stop.entity';
import { ScheduledTrip } from '../entities/scheduled-trip.entity';

/**
 * A standardized DTO for a single stop in the driver's ride list.
 * This mirrors the structure from the trip search for consistency.
 */
class DriverTripStopDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  id: string;

  @ApiProperty({ example: 'Borivali Pickup Point' })
  name: string;

  @ApiProperty({ example: 'Address not specified' })
  address: string;

  @ApiProperty({
    description: 'The latitude of the stop.',
    example: 25.411649,
  })
  latitude: number;

  @ApiProperty({
    description: 'The longitude of the stop.',
    example: 75.651383,
  })
  longitude: number;

  @ApiProperty({ example: 1, description: 'The order of the stop in the route.' })
  sequence: number;

  @ApiProperty({ enum: StopType, example: StopType.PICKUP_DROPOFF })
  type: StopType;

  constructor(stop: RouteStop) {
    this.id = stop.id;
    this.name = stop.name;
    this.address = stop.addressDetails || 'Address not specified';
    this.latitude = stop.location?.coordinates?.[1] || 0;
    this.longitude = stop.location?.coordinates?.[0] || 0;
    this.sequence = stop.sequence;
    this.type = stop.type;
  }
}

/**
 * The final, unified DTO for a driver's ride item.
 */
export class DriverRideItemDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  tripId: string;

  @ApiProperty({ example: 'Manual - Compact SUV' })
  rideType: string;

  @ApiProperty({ example: '25/07/2025, 11:00 PM' })
  dateTime: string;

  @ApiProperty({ example: 30 })
  price: number;

  @ApiProperty({ example: 'Cash' })
  paymentMethod: string;

  @ApiProperty({ example: 'One Way | 0 Hours 22 Mins' })
  tripInfo: string;

  @ApiProperty({
    description: 'The exact departure time of the trip in UTC.',
    example: '2025-07-25T17:30:00.000Z',
  })
  startTime: Date;

  @ApiProperty({
    description: 'The exact estimated arrival time of the trip in UTC.',
    example: '2025-07-25T17:52:00.000Z',
  })
  endTime: Date;

  @ApiProperty({
    description: "The coordinates of the trip's first defined stop.",
  })
  startCoordinates: { latitude: number; longitude: number };

  @ApiProperty({
    description: "The coordinates of the trip's last defined stop.",
  })
  endCoordinates: { latitude: number; longitude: number };

  @ApiProperty({
    type: [DriverTripStopDto],
    description: "The full, ordered list of all stops for the trip's route.",
  })
  stops: DriverTripStopDto[];

  @ApiProperty({ example: 'Driver arrived in 15mins', required: false })
  statusText?: string;

  constructor(trip: ScheduledTrip) {
    this.tripId = trip.id;
    this.rideType = `Manual - ${trip.vehicle?.vehicleType?.name || 'Vehicle'}`;
    this.dateTime = format(new Date(trip.departureDateTime), 'dd/MM/yyyy, hh:mm a');
    this.price = Number(trip.pricePerSeat) || 0;
    this.paymentMethod = 'Cash'; // Placeholder

    const durationMins = differenceInMinutes(
      new Date(trip.estimatedArrivalDateTime),
      new Date(trip.departureDateTime),
    );
    const durationHours = Math.floor(durationMins / 60);
    const remainingMins = durationMins % 60;
    this.tripInfo = `One Way | ${durationHours} Hours ${remainingMins} Mins`;

    this.startTime = trip.departureDateTime;
    this.endTime = trip.estimatedArrivalDateTime;

    // Initialize with defaults
    this.stops = [];
    this.startCoordinates = { latitude: 0, longitude: 0 };
    this.endCoordinates = { latitude: 0, longitude: 0 };

    // ======================== THE FINAL, UNIFIED LOGIC ========================
    // This logic now applies to ALL trips, regardless of bookings.
    if (trip.route?.stops && trip.route.stops.length > 0) {
      // 1. Get all stops from the route and sort them by sequence.
      const allStops = [...trip.route.stops].sort(
        (a, b) => a.sequence - b.sequence,
      );

      // 2. Map them to our new, consistent DTO.
      this.stops = allStops.map((stop) => new DriverTripStopDto(stop));

      // 3. Set the main start/end coordinates from the first and last stops.
      const firstStop = allStops[0];
      const lastStop = allStops[allStops.length - 1];

      if (firstStop?.location?.coordinates) {
        this.startCoordinates = {
          latitude: firstStop.location.coordinates[1],
          longitude: firstStop.location.coordinates[0],
        };
      }
      if (lastStop?.location?.coordinates) {
        this.endCoordinates = {
          latitude: lastStop.location.coordinates[1],
          longitude: lastStop.location.coordinates[0],
        };
      }
    }
    // ========================= END OF FINAL LOGIC =========================

   this.statusText = 'Driver arrived in 15mins'; // Placeholder
  }
}