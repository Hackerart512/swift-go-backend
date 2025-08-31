// src/modules/trips/dto/search-trips.dto.ts
import {
  IsString, IsNotEmpty, IsDateString, IsEnum, IsObject, ValidateNested,
  IsOptional, ValidateIf, IsNumber
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Reusable DTO for coordinates
class CoordinatesDto {
  @IsNumber() latitude: number;
  @IsNumber() longitude: number;
}

// Reusable DTO for a single trip leg's search criteria
export class TripLegSearchDto {
  @IsObject() @ValidateNested() @Type(() => CoordinatesDto) @IsNotEmpty()
  origin: CoordinatesDto;

  @IsObject() @ValidateNested() @Type(() => CoordinatesDto) @IsNotEmpty()
  destination: CoordinatesDto;

  // --- MODIFICATION START ---
  // The 'date' and 'timePeriod' fields are now optional.
  @ApiProperty({ description: 'The specific date to search for (YYYY-MM-DD). If omitted, all future trips are considered.', required: false, example: '2025-07-12' })
  @IsOptional()
  @IsDateString({}, { message: 'Date must be a valid ISO 8601 date string (YYYY-MM-DD).' })
  date?: string;

  @ApiProperty({ description: 'The time of day. If omitted, trips from all time periods are considered.', enum: ['AM', 'PM'], required: false, example: 'PM' })
  @IsOptional()
  @IsEnum(['AM', 'PM'], { message: 'timePeriod must be either AM or PM' })
  timePeriod?: 'AM' | 'PM';
  // --- MODIFICATION END ---
}

// The main DTO for the /trips/search endpoint
export class SearchTripsDto {
  @ApiProperty({ description: 'The type of trip search.', enum: ['oneway', 'roundtrip'], example: 'oneway' })
  @IsEnum(['oneway', 'roundtrip'], { message: 'tripType must be either oneway or roundtrip' })
  @IsNotEmpty()
  tripType: 'oneway' | 'roundtrip';

  @ApiProperty({ description: 'Details for the onward journey.' })
  @IsObject()
  @ValidateNested()
  @Type(() => TripLegSearchDto)
  @IsNotEmpty()
  onward: TripLegSearchDto;

  @ApiProperty({ description: 'Details for the return journey. Required if tripType is "roundtrip".', required: false })
  @ValidateIf(o => o.tripType === 'roundtrip')
  @IsObject()
  @ValidateNested()
  @Type(() => TripLegSearchDto)
  @IsNotEmpty({ message: 'Return trip details are required for a roundtrip search.' })
  return?: TripLegSearchDto;
}

// Exporting with an alias, keeping as is.
export { SearchTripsDto as SearchTripsByCoordsDto };