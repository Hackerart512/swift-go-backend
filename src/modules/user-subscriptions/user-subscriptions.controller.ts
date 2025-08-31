// src/modules/user-subscriptions/user-subscriptions.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserSubscriptionsService } from './user-subscriptions.service';
import { CreateCommuterPassDto } from './dto/create-commuter-pass.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserSubscription } from './entities/user-subscription.entity';
import { EntityManager } from 'typeorm';
import { ScheduledTrip } from '../trips/entities/scheduled-trip.entity';
import { UserJwtAuthGuard } from '../auth/guards/user-jwt-auth.guard';

@ApiTags('User Subscriptions')
@ApiBearerAuth()
@Controller('user-subscriptions')
@UseGuards(UserJwtAuthGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
)
export class UserSubscriptionsController {
  constructor(private readonly userSubsService: UserSubscriptionsService) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Subscribe user to a plan for a specific commute (oneway or roundtrip).' })
  @ApiResponse({ status: 201, description: 'User subscribed to plan. Returns one or two subscription records.' })
  async subscribe(
    @Request() req,
    @Body() createCommuterPassDto: CreateCommuterPassDto,
  ): Promise<UserSubscription | UserSubscription[]> { // --- MODIFICATION: Updated the return type here
    const userId = req.user.id || req.user.sub;
    return this.userSubsService.createCommuterPass(userId, createCommuterPassDto);
  }

  @Get('current')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current active subscription for user' })
  @ApiResponse({ status: 200, description: 'Current active subscription returned.' })
  async getCurrentActiveSubscription(
    @Request() req: { user: { id?: string; sub?: string } },
  ): Promise<UserSubscription | null> {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return null;
    }
    // This may need adjustment if a user can have multiple active subs (e.g. one morning, one evening)
    // For now, it finds the one that expires latest. This logic can be refined later if needed.
    return this.userSubsService.findUserActiveSubscription(userId);
  }

  @Get('history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get subscription history for user' })
  @ApiResponse({ status: 200, description: 'Subscription history returned.' })
  async getSubscriptionHistory(
    @Request() req: { user: { id?: string; sub?: string } },
  ): Promise<UserSubscription[]> {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return [];
    }
    return this.userSubsService.findUserSubscriptionHistory(userId);
  }

  @Post('consume-ride')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Consume a ride from user subscription' })
  @ApiResponse({ status: 200, description: 'Ride consumed from subscription.' })
  async consumeRide(
    @Request() req: { user: { id?: string; sub?: string } },
    @Body() bookingDetails: { pickupStopId: string; dropOffStopId: string; tripTime: Date }
  ) {
    const userId = req.user.id || req.user.sub;
    if (!userId) throw new Error('User ID not found in request.');
    // Note: The consumeRide logic in the service is already correct, it finds the pass
    // that matches the specific commute (morning or evening stops). No change needed here.
    return this.userSubsService.consumeRide(userId, 1, bookingDetails, undefined);
  }
}