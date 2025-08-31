// src/modules/drivers/driver-dashboard.controller.ts
import { Controller, Get, Patch, Body, UseGuards, Request as NestRequest } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DriverJwtAuthGuard } from '../auth/guards/driver-jwt-auth.guard';
import { DriversService } from './drivers.service';
import { TripsService } from '../trips/trips.service';
import { DriverDashboardDto } from './dto/driver-dashboard.dto';
import { UpdateDriverLocationDto } from './dto/update-driver-location.dto'; 

// Define the interface for our authenticated request
interface AuthenticatedDriverRequest extends Request {
  user: { id: string; role: 'driver'; /* other jwt payload fields */ };
}

@ApiTags('Driver - Dashboard')
@ApiBearerAuth()
@UseGuards(DriverJwtAuthGuard)
@Controller('driver') // The base path for this controller is /driver
export class DriverDashboardController {
  constructor(
    private readonly driversService: DriversService,
    private readonly tripsService: TripsService,
  ) {}

  @Get('dashboard')
  async getDashboardData(
    @NestRequest() req: AuthenticatedDriverRequest,
  ): Promise<DriverDashboardDto> {
    const driverId = req.user.id;

    const [earningsData, tripData] = await Promise.all([
      this.driversService.getDashboardData(driverId),
      this.tripsService.getDriverDashboardTripInfo(driverId),
    ]);

    return new DriverDashboardDto(earningsData, tripData);
  }

  // ============== THIS IS THE CORRECTED ENDPOINT ============== //
  @Patch('dashboard/location') // The full path will be PATCH /driver/dashboard/location
  @ApiOperation({ summary: "Update a driver's live location" })
  async updateLocation(
    @NestRequest() req: AuthenticatedDriverRequest,
    @Body() updateDriverLocationDto: UpdateDriverLocationDto,
  ): Promise<{ message: string }> {
    const driverId = req.user.id; 
    
    // STEP 1: Call the service and AWAIT it to complete the database update.
    await this.driversService.updateDriverLocation(
      driverId,
      updateDriverLocationDto,
    );

    // STEP 2: Now, return the correct object that matches the function's promise.
    return { message: 'Location updated successfully.' };
  }
  // ============================================================= //
}