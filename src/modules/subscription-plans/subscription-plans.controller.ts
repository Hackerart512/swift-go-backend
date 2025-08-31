/* eslint-disable @typescript-eslint/no-unused-vars */
// src/modules/subscription-plans/subscription-plans.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubscriptionPlansService } from './subscription-plans.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
// import { AdminGuard } from '../../common/guards/admin.guard';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Subscription Plans')
@Controller('subscription-plans') // Base path
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
)
export class SubscriptionPlansController {
  constructor(private readonly plansService: SubscriptionPlansService) {}

  // --- Endpoint for Passengers (Public) ---
  @Get() // GET /subscription-plans - lists active plans for passengers
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all active subscription plans for passengers' })
  @ApiResponse({ status: 200, description: 'List of active subscription plans returned.' })
  async findActivePlansForPassengers(): Promise<SubscriptionPlan[]> {
    return this.plansService.findAllActiveForPassengers();
  }

  // --- Endpoints for Admin (Should be protected) ---

  // @UseGuards(JwtAuthGuard, AdminGuard) // TODO: Add Admin protection
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new subscription plan (admin)' })
  @ApiResponse({ status: 201, description: 'Subscription plan created.' })
  async create(
    @Body() createDto: CreateSubscriptionPlanDto,
  ): Promise<SubscriptionPlan> {
    return this.plansService.create(createDto);
  }

  // @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/all') // Differentiate from public GET all
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all subscription plans (admin)' })
  @ApiResponse({ status: 200, description: 'List of all subscription plans returned.' })
  async findAllAdmin(): Promise<SubscriptionPlan[]> {
    return this.plansService.findAllForAdmin();
  }

  // @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a subscription plan by ID (admin)' })
  @ApiResponse({ status: 200, description: 'Subscription plan returned.' })
  async findOneAdmin(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SubscriptionPlan> {
    return this.plansService.findOneForAdmin(id);
  }

  // @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('admin/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a subscription plan (admin)' })
  @ApiResponse({ status: 200, description: 'Subscription plan updated.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateSubscriptionPlanDto,
  ): Promise<SubscriptionPlan> {
    return this.plansService.update(id, updateDto);
  }

  // @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('admin/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a subscription plan (admin)' })
  @ApiResponse({ status: 204, description: 'Subscription plan deleted.' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.plansService.remove(id);
  }
}
