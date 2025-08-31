// src/modules/trips/trips.controller.ts

import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { ScheduledTrip } from './entities/scheduled-trip.entity';
import { SearchTripsDto } from './dto/search-trips.dto';
import { TripSearchResponseDto } from './dto/trip-search-response.dto';
import { TripSeatLayoutDto } from './dto/trip-seat-layout.dto'; // <-- IMPORT THE DTO

@ApiTags('Trips & Seat Availability')
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post('search')
  @ApiOperation({
    summary: 'Search for available trips based on location and date',
  })
  @ApiResponse({
    status: 200,
    description: 'A list of matching scheduled trips.',
    type: TripSearchResponseDto,
  })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  searchForTrips(
    @Body() searchTripsDto: SearchTripsDto,
  ): Promise<TripSearchResponseDto> {
    return this.tripsService.searchForAvailableTrips(searchTripsDto);
  }

  @Get(':id/details')
  @ApiOperation({ summary: 'Get public details of a specific scheduled trip' })
  @ApiResponse({
    status: 200,
    description: 'Detailed information about the trip.',
    type: ScheduledTrip,
  })
  @ApiResponse({ status: 404, description: 'Trip not found or not available.' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ScheduledTrip> {
    return this.tripsService.findPublicTripById(id);
  }

  // --- NEW ENDPOINT ADDED HERE ---
  @Get(':id/seat-layout')
  @ApiOperation({ summary: "Get the seat layout for a specific trip" })
  @ApiResponse({
      status: 200,
      description: 'The seat layout of the trip.',
      type: TripSeatLayoutDto,
  })
  @ApiResponse({ status: 404, description: 'Trip not found.' })
  async getSeatLayout(
      @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TripSeatLayoutDto> {
      return this.tripsService.getTripSeatLayout(id);
  }
}