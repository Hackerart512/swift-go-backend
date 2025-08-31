// src/modules/promotions/promotions.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromotionsService } from './promotions.service';
import { PromotionsController } from './promotions.controller';
import { Promotion } from './entities/promotion.entity';
// import { AuthModule } from '../auth/auth.module'; // If admin routes use JwtAuthGuard

@Module({
  imports: [
    TypeOrmModule.forFeature([Promotion]),
    // AuthModule, // Uncomment if admin routes are protected by JwtAuthGuard
  ],
  controllers: [PromotionsController],
  providers: [PromotionsService],
})
export class PromotionsModule {}