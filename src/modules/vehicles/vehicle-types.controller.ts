/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/modules/vehicles/vehicle-types.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseGuards, // To be added later for admin protection
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VehicleTypesService } from './vehicle-types.service';
import { CreateVehicleTypeDto } from './dto/create-vehicle-type.dto';
import { UpdateVehicleTypeDto } from './dto/update-vehicle-type.dto';
import { VehicleType } from './entities/vehicle-type.entity';
// import { AdminGuard } from '../../common/guards/admin.guard'; // Example
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Example

@ApiTags('Vehicle Types')
@Controller('admin/vehicle-types') // Suggesting an 'admin/' prefix for admin-only routes
// @UseGuards(JwtAuthGuard, AdminGuard) // TODO: Secure these endpoints for admin users
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
)
export class VehicleTypesController {
  constructor(private readonly vehicleTypesService: VehicleTypesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new vehicle type (admin)' })
  @ApiResponse({ status: 201, description: 'Vehicle type created.' })
  async create(
    @Body() createVehicleTypeDto: CreateVehicleTypeDto,
  ): Promise<VehicleType> {
    return this.vehicleTypesService.create(createVehicleTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all vehicle types (admin)' })
  @ApiResponse({ status: 200, description: 'List of vehicle types returned.' })
  async findAll(): Promise<VehicleType[]> {
    return this.vehicleTypesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a vehicle type by ID (admin)' })
  @ApiResponse({ status: 200, description: 'Vehicle type returned.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<VehicleType> {
    return this.vehicleTypesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a vehicle type (admin)' })
  @ApiResponse({ status: 200, description: 'Vehicle type updated.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVehicleTypeDto: UpdateVehicleTypeDto,
  ): Promise<VehicleType> {
    return this.vehicleTypesService.update(id, updateVehicleTypeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a vehicle type (admin)' })
  @ApiResponse({ status: 204, description: 'Vehicle type deleted.' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.vehicleTypesService.remove(id);
  }
}
