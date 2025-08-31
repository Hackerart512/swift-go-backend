// src/modules/promotions/promotions.controller.ts
import {
  Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards, HttpCode, HttpStatus, UsePipes, ValidationPipe, Req
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';
import { Request as ExpressRequest } from 'express';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { Promotion } from './entities/promotion.entity';
// import { AdminGuard } from '../../common/guards/admin.guard'; // For admin-only routes
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // If some admin actions need basic auth

@ApiTags('Promotions')
@Controller('promotions')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }))
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  // --- Endpoints for Passengers (Public) ---
  @Get('active') // Endpoint for passengers to see active promotions
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all active promotions for passengers' })
  @ApiResponse({ status: 200, description: 'List of active promotions returned.' })
  async findActive(): Promise<Promotion[]> {
    return this.promotionsService.findActiveForPassengers();
  }

  // --- Endpoints for Admin (Should be protected by an AdminGuard) ---

  // @UseGuards(JwtAuthGuard, AdminGuard) // Example protection
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new promotion (admin)' })
  @ApiResponse({ status: 201, description: 'Promotion created.' })
  async create(@Body() createPromotionDto: CreatePromotionDto, @Req() request: ExpressRequest): Promise<Promotion> {
    console.log('--- RAW EXPRESS REQUEST BODY ---:');
    console.log(JSON.stringify(request.body, null, 2)); // This is what Express received

    console.log('--- DTO AFTER NESTJS PARSING & VALIDATION (if successful) ---:');
    console.log(JSON.stringify(createPromotionDto, null, 2));
    return this.promotionsService.create(createPromotionDto);
  }

  // @UseGuards(JwtAuthGuard, AdminGuard)
  @Get() // Admin gets all promotions
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all promotions (admin)' })
  @ApiResponse({ status: 200, description: 'List of all promotions returned.' })
  async findAllAdmin(): Promise<Promotion[]> {
    return this.promotionsService.findAllForAdmin();
  }

  // @UseGuards(JwtAuthGuard, AdminGuard)
  @Get(':id') // Admin gets a specific promotion by ID
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a promotion by ID (admin)' })
  @ApiResponse({ status: 200, description: 'Promotion returned.' })
  async findOneAdmin(@Param('id', ParseUUIDPipe) id: string): Promise<Promotion> {
    return this.promotionsService.findOneForAdmin(id);
  }

  // @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a promotion (admin)' })
  @ApiResponse({ status: 200, description: 'Promotion updated.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePromotionDto: UpdatePromotionDto,
  ): Promise<Promotion> {
    return this.promotionsService.update(id, updatePromotionDto);
  }

  // @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // 204 No Content for successful deletion
  @ApiOperation({ summary: 'Delete a promotion (admin)' })
  @ApiResponse({ status: 204, description: 'Promotion deleted.' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.promotionsService.remove(id);
  }
}