// src/modules/tracking/tracking.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingGateway } from './tracking.gateway';
import { Booking } from '../bookings/entities/booking.entity';
import { DriversModule } from '../drivers/drivers.module'; // <-- IMPORT DriversModule
import { TripsModule } from '../trips/trips.module'; // <-- IMPORT TripsModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    forwardRef(() => DriversModule), // <-- ADD DriversModule here
    forwardRef(() => TripsModule),   // <-- ADD TripsModule here
  ],
  providers: [TrackingGateway],
  exports: [TrackingGateway],
})
export class TrackingModule {}