// src/modules/user-subscriptions/user-subscriptions.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSubscriptionsService } from './user-subscriptions.service';
import { UserSubscriptionsController } from './user-subscriptions.controller';
import { UserSubscription } from './entities/user-subscription.entity';
import { AuthModule } from '../auth/auth.module'; // For JwtAuthGuard
import { SubscriptionPlansModule } from '../subscription-plans/subscription-plans.module'; // To use SubscriptionPlansService
import { UsersModule } from '../users/users.module'; // To use UsersService
import { RoutesModule } from '../routes/routes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserSubscription]),
    forwardRef(() => AuthModule),
    SubscriptionPlansModule, // So UserSubscriptionsService can inject SubscriptionPlansService
    forwardRef(() => UsersModule), // So UserSubscriptionsService can inject UsersService
    RoutesModule,
  ],
  controllers: [UserSubscriptionsController],
  providers: [UserSubscriptionsService],
  exports: [UserSubscriptionsService], // Export if other services (e.g., BookingsService) need it
})
export class UserSubscriptionsModule {}
