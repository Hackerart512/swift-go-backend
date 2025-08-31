// src/modules/trips/trips.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripsService } from './trips.service';
import {
  DriverTripsController,
  DriverBookingsController,
} from './driver-trips.controller';
import { ScheduledTrip } from './entities/scheduled-trip.entity';
import { AuthModule } from '../auth/auth.module';
import { RoutesModule } from '../routes/routes.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { UsersModule } from '../users/users.module';
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../users/users.entity';
import { RouteStop } from '../routes/entities/route-stop.entity';
import { AdminTripsController } from './admin-trips.controller';
import { DriversModule } from '../drivers/drivers.module';
import { HttpModule } from '@nestjs/axios';
import { BookingsModule } from '../bookings/bookings.module';
import { ConfigModule } from '@nestjs/config';
import { NotificationsModule } from '../notifications/notifications.module';
import { TripsController } from './trips.controller'; // <--- ADD THIS IMPORT

@Module({
  imports: [
    TypeOrmModule.forFeature([ScheduledTrip, Booking, User, RouteStop]),
    ConfigModule,
    forwardRef(() => AuthModule),
    RoutesModule,
    HttpModule,
    VehiclesModule,
    forwardRef(() => UsersModule),
    forwardRef(() => DriversModule),
    forwardRef(() => BookingsModule),
    NotificationsModule,
  ],
  controllers: [
    AdminTripsController,
    DriverTripsController,
    DriverBookingsController,
    TripsController, // <--- ADD THE PUBLIC CONTROLLER HERE
  ],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}