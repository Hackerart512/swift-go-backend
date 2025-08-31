// src/modules/trips/driver-trips.controller.ts

import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Request as NestRequest,
  Query,
  BadRequestException,
  Post,
  HttpCode,
  HttpStatus,
  Patch,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { DriverJwtAuthGuard } from '../auth/guards/driver-jwt-auth.guard';
import { TripsService } from './trips.service';
import { BookingsService } from '../bookings/bookings.service';
import { PassengerForTripDto } from '../bookings/dto/passenger-for-trip.dto';
import { OptimizedRouteDto } from './dto/optimized-route.dto';
import { DriverRideItemDto } from './dto/driver-ride-item.dto';
import { DriverTripStatusQuery } from './types/driver-trip-status.query.enum';
import { Booking } from '../bookings/entities/booking.entity';
import { ScheduledTrip } from './entities/scheduled-trip.entity';
import { DeclineBookingDto } from '../bookings/dto/decline-booking.dto';

interface AuthenticatedDriverRequest extends Request {
  user: { id: string; role: 'driver' };
}

@ApiTags('Driver - Trip Management')
@ApiBearerAuth()
@UseGuards(DriverJwtAuthGuard)
@Controller('driver/trips')
export class DriverTripsController {
  constructor(
    private readonly tripsService: TripsService,
    private readonly bookingsService: BookingsService,
  ) {}

  @Patch(':tripId/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start a scheduled trip (Unlock the entire ride)' })
  @ApiResponse({
    status: 200,
    description: 'The trip has been successfully started.',
    type: ScheduledTrip,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Driver is not assigned to this trip.',
  })
  @ApiResponse({ status: 404, description: 'Trip not found.' })
  @ApiResponse({
    status: 400,
    description:
      'Trip is not in a startable state (e.g., already active or completed).',
  })
  async startTrip(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @NestRequest() req: AuthenticatedDriverRequest,
  ): Promise<ScheduledTrip> {
    const driverId = req.user.id;
    return this.tripsService.startTrip(tripId, driverId);
  }

  @Get('my-rides')
  @ApiOperation({
    summary: "Get the authenticated driver's rides, filtered by status.",
  })
  async getMyRides(
    @NestRequest() req: AuthenticatedDriverRequest,
    @Query('status') status: DriverTripStatusQuery,
  ): Promise<DriverRideItemDto[]> {
    if (!status || !Object.values(DriverTripStatusQuery).includes(status)) {
      throw new BadRequestException(
        'A valid status query parameter (upcoming, completed, or cancelled) is required.',
      );
    }
    const driverId = req.user.id;
    return this.tripsService.findDriverRides(driverId, status);
  }

  @Get(':tripId/passengers')
  @ApiOperation({ summary: "Get passenger list for a driver's specific trip" })
  async getTripPassengers(
    @NestRequest() req: AuthenticatedDriverRequest,
    @Param('tripId', ParseUUIDPipe) tripId: string,
  ): Promise<PassengerForTripDto[]> {
    const driverId = req.user.id;
    return this.bookingsService.findPassengersForDriverTrip(driverId, tripId);
  }

  @Get(':tripId/optimized-pickup-route')
  @ApiOperation({
    summary: 'Get the optimized pickup route using Google Directions API',
  })
  async getOptimizedPickupRoute(
    @NestRequest() req: AuthenticatedDriverRequest,
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Query('driverLat') driverLat: number,
    @Query('driverLng') driverLng: number,
  ): Promise<OptimizedRouteDto> {
    if (!driverLat || !driverLng) {
      throw new BadRequestException(
        'Current driver latitude and longitude are required.',
      );
    }
    const driverId = req.user.id;
    const driverLocation = { latitude: +driverLat, longitude: +driverLng };
    return this.tripsService.getOptimizedPickupRoute(
      driverId,
      tripId,
      driverLocation,
    );
  }
}

@ApiTags('Driver - Booking Actions')
@ApiBearerAuth()
@UseGuards(DriverJwtAuthGuard)
@Controller('driver/bookings')
export class DriverBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post(':bookingId/onboard-start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Onboard a passenger and start their individual ride (sets status to ONGOING).',
  })
  @ApiResponse({
    status: 200,
    description:
      'Passenger ride started successfully. Status updated to ONGOING.',
    type: Booking,
  })
  @ApiResponse({
    status: 403,
    description: 'Driver not authorized for this booking.',
  })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  async onboardAndStartRide(
    @NestRequest() req: AuthenticatedDriverRequest,
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
  ): Promise<Booking> {
    const driverId = req.user.id;
    return this.bookingsService.onboardPassenger(driverId, bookingId);
  }

  @Post(':bookingId/decline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Decline a passenger booking (e.g., no-show), returning the seat to inventory.',
  })
  @ApiBody({ type: DeclineBookingDto })
  @ApiResponse({
    status: 200,
    description: 'Booking declined successfully. Status updated to DECLINED_BY_DRIVER.',
    type: Booking,
  })
  @ApiResponse({
    status: 403,
    description: 'Driver not authorized for this booking.',
  })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  async declineBooking(
    @NestRequest() req: AuthenticatedDriverRequest,
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @Body() declineBookingDto: DeclineBookingDto,
  ): Promise<Booking> {
    const driverId = req.user.id;
    return this.bookingsService.declineBookingByDriver(driverId, bookingId, declineBookingDto);
  }
}