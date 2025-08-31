// src/modules/trips/admin-trips.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { CreateScheduledTripDto } from './dto/create-scheduled-trip.dto';
import { UpdateScheduledTripDto } from './dto/update-scheduled-trip.dto';
import { ScheduledTrip, TripStatus } from './entities/scheduled-trip.entity';

@ApiTags('Admin: Trips')
@Controller('admin/trips')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class AdminTripsController {
  constructor(private readonly tripsService: TripsService) {}

  // POST /admin/trips
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new scheduled trip (or multiple recurring trips) (Admin)' })
  // --- FIX IS HERE: The response is now an array of trips ---
  @ApiResponse({ status: 201, description: 'Scheduled trip(s) created successfully.', type: [ScheduledTrip] })
  // --- AND HERE: The return type is now an array ---
  async create(@Body() createTripDto: CreateScheduledTripDto): Promise<ScheduledTrip[]> {
    return this.tripsService.create(createTripDto);
  }

  // GET /admin/trips
  @Get()
  @ApiOperation({ summary: 'Get all scheduled trips (Admin)' })
  @ApiResponse({ status: 200, description: 'List of scheduled trips returned.' })
  async findAllForAdmin(
    @Query('date') date?: string,
    @Query('routeId') routeId?: string,
    @Query('status') status?: TripStatus,
  ): Promise<ScheduledTrip[]> {
    return this.tripsService.findAllForAdmin({ date, routeId, status });
  }

  // GET /admin/trips/:id
  @Get(':id')
  @ApiOperation({ summary: 'Get a scheduled trip by ID (Admin)' })
  @ApiResponse({ status: 200, description: 'Scheduled trip returned.' })
  async findOneForAdmin(@Param('id', ParseUUIDPipe) id: string): Promise<ScheduledTrip> {
    return this.tripsService.findOneForAdmin(id);
  }

  // PATCH /admin/trips/:id
  @Patch(':id')
  @ApiOperation({ summary: 'Update a scheduled trip (Admin)' })
  @ApiResponse({ status: 200, description: 'Scheduled trip updated.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTripDto: UpdateScheduledTripDto,
  ): Promise<ScheduledTrip> {
    return this.tripsService.update(id, updateTripDto);
  }

  // DELETE /admin/trips/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a scheduled trip (Admin)' })
  @ApiResponse({ status: 204, description: 'Scheduled trip deleted.' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.tripsService.remove(id);
  }
}