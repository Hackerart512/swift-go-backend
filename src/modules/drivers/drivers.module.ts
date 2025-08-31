// src/modules/drivers/drivers.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Driver } from './entities/driver.entity';
import { DriverWallet } from './entities/driver-wallet.entity';
import { DriverEarning } from './entities/driver-earning.entity';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';
import { DriverDashboardController } from './driver-dashboard.controller';
import { TripsModule } from '../trips/trips.module';
import { AuthModule } from '../auth/auth.module';
import { AdminDriversController } from './admin-drivers.controller';
import { ScheduledTrip } from '../trips/entities/scheduled-trip.entity';
import { Booking } from '../bookings/entities/booking.entity';

// NO import for TrackingModule here

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Driver,
      DriverWallet,
      DriverEarning,
      ScheduledTrip,
      Booking,
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => TripsModule),
    // TrackingModule is NOT imported here. This is crucial.
  ],
  controllers: [
    DriversController,
    DriverDashboardController,
    AdminDriversController,
  ],
  providers: [DriversService],
  exports: [DriversService], // We export the service so other modules (like TrackingModule) can use it
})
export class DriversModule {}