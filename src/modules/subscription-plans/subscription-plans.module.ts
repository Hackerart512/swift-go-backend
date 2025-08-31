// src/modules/subscription-plans/subscription-plans.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPlansService } from './subscription-plans.service';
import { SubscriptionPlansController } from './subscription-plans.controller';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
// import { AuthModule } from '../auth/auth.module'; // If admin routes use JwtAuthGuard

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionPlan]),
    // AuthModule, // If admin routes need JwtAuthGuard
  ],
  controllers: [SubscriptionPlansController],
  providers: [SubscriptionPlansService],
  exports: [SubscriptionPlansService], // Export if UserSubscriptionsService needs it
})
export class SubscriptionPlansModule {}
