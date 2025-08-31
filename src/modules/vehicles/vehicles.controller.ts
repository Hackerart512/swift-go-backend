/* eslint-disable @typescript-eslint/no-unused-vars */
// src/modules/vehicles/vehicles.controller.ts
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
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VehiclesService } from './vehicle.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle } from './entities/vehicle.entity'; // For return type hinting
// import { AdminGuard } from '../../common/guards/admin.guard'; // Example, if you create one
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Example, if admin routes use JWT

@ApiTags('Vehicles')
@Controller('admin/vehicles') // Admin-specific path prefix
// @UseGuards(JwtAuthGuard, AdminGuard) // TODO: Secure these endpoints for admin users
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new vehicle (admin)' })
  @ApiResponse({ status: 201, description: 'Vehicle created.' })
  async create(@Body() createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    return this.vehiclesService.create(createVehicleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all vehicles (admin)' })
  @ApiResponse({ status: 200, description: 'List of vehicles returned.' })
  async findAll(): Promise<Vehicle[]> {
    return this.vehiclesService.findAll();
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get a vehicle by ID (admin)' })
  @ApiResponse({ status: 200, description: 'Vehicle returned.' })
  @ApiResponse({ status: 404, description: 'Vehicle not found.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Vehicle> {
    const vehicle = await this.vehiclesService.findOne(id);
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with id ${id} not found`);
    }
    return vehicle;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a vehicle (admin)' })
  @ApiResponse({ status: 200, description: 'Vehicle updated.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a vehicle (admin)' })
  @ApiResponse({ status: 204, description: 'Vehicle deleted.' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.vehiclesService.remove(id);
    return;
  }
}
