// src/modules/drivers/admin-drivers.controller.ts

import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UsePipes,
  ValidationPipe,
  NotFoundException,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { Driver, DriverStatus } from './entities/driver.entity';
import { UpdateDriverStatusDto } from './dto/update-driver-status.dto';
import { RejectDriverDto } from './dto/reject-driver.dto'; // <-- IMPORT THE NEW DTO

@ApiTags('Admin: Drivers')
@Controller('admin/drivers')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AdminDriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get()
  @ApiOperation({ summary: 'Get all drivers (for admin panel)' })
  @ApiResponse({ status: 200, type: [Driver] })
  findAll(): Promise<Driver[]> {
    return this.driversService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single driver by ID (for admin panel)' })
  @ApiResponse({ status: 200, type: Driver })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Driver> {
    const driver = await this.driversService.findById(id);
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${id} not found.`);
    }
    return driver;
  }

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a pending driver' })
  @ApiResponse({ status: 200, description: 'Driver approved successfully.' })
  async approveDriver(@Param('id', ParseUUIDPipe) id: string): Promise<Driver> {
    const dto: UpdateDriverStatusDto = { status: DriverStatus.ACTIVE };
    return this.driversService.updateDriverStatus(id, dto);
  }

  // --- THIS METHOD IS NOW FIXED ---
  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a pending driver' })
  @ApiResponse({ status: 200, description: 'Driver rejected successfully.' })
  async rejectDriver(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() rejectDto: RejectDriverDto, // Use the new, specific DTO for validation
  ): Promise<Driver> {
    // Construct the full DTO that the service method expects
    const statusDto: UpdateDriverStatusDto = {
      status: DriverStatus.REJECTED,
      rejectionReason: rejectDto.rejectionReason,
    };
    return this.driversService.updateDriverStatus(id, statusDto);
  }
}
