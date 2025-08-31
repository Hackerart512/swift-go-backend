import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from './entities/booking.entity';
import { AuthModule } from '../auth/auth.module';
import { TripsModule } from '../trips/trips.module';
import { UsersModule } from '../users/users.module';
import { UserSubscriptionsModule } from '../user-subscriptions/user-subscriptions.module';
import { User } from '../users/users.entity';
import { ScheduledTrip } from '../trips/entities/scheduled-trip.entity';

// 1. Import the new admin controller
import { AdminBookingsController } from './admin-bookings.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, User, ScheduledTrip]),
    forwardRef(() => AuthModule),
    forwardRef(() => TripsModule),
    forwardRef(() => UsersModule),
    UserSubscriptionsModule,
  ],
  // 2. Add the AdminBookingsController to the list of controllers
  controllers: [BookingsController, AdminBookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
