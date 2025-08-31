// src/modules/trips/dto/trip-search-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { StopType } from '../../routes/entities/route-stop.entity';

// DTO for the nested vehicle information
export class VehicleInfo {
  @ApiProperty({ example: 'Standard Car' })
  type: string;

  @ApiProperty({ example: 'Hyundai Creta', nullable: true })
  model: string;

  @ApiProperty({ example: 'TS-01-AB-1234' })
  registrationNumber: string;
}

// ============================= THIS IS THE NEW DTO =============================
// DTO for a single stop within the search result's new 'stops' array
export class TripStopDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  id: string;

  @ApiProperty({ example: 'Borivali Pickup Point' })
  name: string;

  @ApiProperty({ example: 25.411649 })
  latitude: number;

  @ApiProperty({ example: 75.651383 })
  longitude: number;

  @ApiProperty({ example: 1, description: 'The order of the stop in the route.' })
  sequence: number;

  @ApiProperty({ enum: StopType, example: StopType.PICKUP })
  type: StopType;
}
// ==============================================================================

// DTO for a single trip item in the list
export class TripSearchResultItem {
  @ApiProperty({ example: 'c5d3bb53-5c11-4a8f-81b3-2fa24919b7a1' })
  scheduledTripId: string;

  @ApiProperty({ example: 'Tech Park Express' })
  routeName: string;

  @ApiProperty({ example: 'e3fb6b58-ad38-4680-8a71-d567a92e730c' })
  pickupStopId: string;

  @ApiProperty({ example: '3010af85-3b83-401e-99c7-310766ac864b' })
  destinationStopId: string;

  @ApiProperty({ example: 'Central Bus Station' })
  pickupLocationName: string;

  @ApiProperty({ example: 'Tech Park Main Gate' })
  destinationLocationName: string;

  @ApiProperty({ example: '2025-07-15T09:00:00.000Z' })
  departureDateTime: string;

  @ApiProperty({ example: '2025-07-15T10:00:00.000Z' })
  estimatedArrivalDateTime: string;

  @ApiProperty({ description: 'A human-readable trip duration', example: '1h 0min' })
  durationText: string;

  @ApiProperty({ example: 150 })
  price: number;

  @ApiProperty({ example: 'INR' })
  currency: string;

  @ApiProperty({ example: 3 })
  availableSeats: number;

  @ApiProperty()
  vehicleInfo: VehicleInfo;
  
  // ============================= THIS IS THE NEW PROPERTY =============================
  @ApiProperty({
    type: [TripStopDto],
    description: "The full, ordered list of stops for the trip's route.",
  })
  stops: TripStopDto[];
  // ====================================================================================
}

// The main response object
export class TripSearchResponseDto {
  @ApiProperty({ type: [TripSearchResultItem] })
  onwardTrips: TripSearchResultItem[];

  @ApiProperty({ type: [TripSearchResultItem] })
  returnTrips: TripSearchResultItem[];
}