// src/modules/bookings/admin-bookings.controller.ts

import {
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Body,
  Query,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { Booking } from './entities/booking.entity';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CreateAdminBookingDto } from './dto/create-admin-booking.dto';
// --- FIX: Import the BookingTripType enum ---
import { BookingTripType } from './dto/create-booking.dto';

@ApiTags('Admin: Bookings')
@Controller('admin/bookings')
// TODO: Add AdminGuard @UseGuards(JwtAuthGuard, AdminGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class AdminBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // =======================================================================
  // === TEMPORARY SIDE-DOOR ENDPOINT FOR TESTING ==========================
  // =======================================================================
  @Post('create-for-test')
  @ApiOperation({ summary: 'Create a booking for any user (Test Endpoint)' })
  @ApiResponse({ status: 201, description: 'Booking created successfully.' })
  createBookingForUser(
    @Body() createAdminBookingDto: CreateAdminBookingDto,
  ): Promise<Booking> {
    // We now call our new, insecure method
    return this.bookingsService.createInsecureBookingForTest(
      createAdminBookingDto.userId,
      {
        // --- FIX: Added the mandatory tripType property ---
        tripType: BookingTripType.ONE_WAY,

        // We need to shape the DTO to match what the service expects
        onwardScheduledTripId: createAdminBookingDto.tripId,
        onwardPickupStopId: createAdminBookingDto.pickupStopId,
        onwardDropOffStopId: createAdminBookingDto.dropoffStopId,
        onwardSelectedSeatIds: ['seat_1'], // Using a placeholder seat ID
        paymentMethod: 'cash' as any, // Using a placeholder payment method
        // Add other required fields from CreateBookingDto with default values if necessary
        couponCode: undefined,
        paymentGatewayReferenceId: undefined,
      },
    );
  }
  // =======================================================================
  // =======================================================================

  // GET /admin/bookings
  @Get()
  @ApiOperation({ summary: 'Get all bookings (Admin)' })
  @ApiResponse({ status: 200, description: 'List of all bookings.' })
  async findAllForAdmin(@Query() query: any): Promise<Booking[]> {
    // We will create a new 'findAllForAdmin' method in the service
    return this.bookingsService.findAllForAdmin(query);
  }

  // GET /admin/bookings/:id
  @Get(':id')
  @ApiOperation({ summary: 'Get a single booking by ID (Admin)' })
  @ApiResponse({ status: 200, description: 'Booking details.' })
  async findOneForAdmin(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Booking> {
    // We will create a new 'findOneForAdmin' method in the service
    return this.bookingsService.findOneForAdmin(id);
  }

  // PATCH /admin/bookings/:id
  @Patch(':id')
  @ApiOperation({ summary: 'Update a booking (e.g., change status) (Admin)' })
  @ApiResponse({ status: 200, description: 'Booking updated.' })
  async updateBooking(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBookingDto: UpdateBookingDto,
  ): Promise<Booking> {
    // We will create a new 'updateForAdmin' method in the service
    return this.bookingsService.updateForAdmin(id, updateBookingDto);
  }

  // DELETE /admin/bookings/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a booking (Admin)' })
  @ApiResponse({ status: 204, description: 'Booking deleted.' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    // We will create a new 'removeForAdmin' method in the service
    return this.bookingsService.removeForAdmin(id);
  }
}