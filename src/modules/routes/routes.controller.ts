// src/modules/routes/routes.controller.ts

import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RoutesService } from './routes.service';
import { Route } from './entities/route.entity';
import { RouteStop } from './entities/route-stop.entity';

@ApiTags('Routes (Public)') // Renamed for clarity in API docs
@Controller('routes')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  // --- PASSENGER / PUBLIC-FACING 'GET' ENDPOINTS ---
  // All Admin (POST, PATCH, DELETE) endpoints have been moved to admin-routes.controller.ts

  @Get() // GET /routes - Lists all ACTIVE routes
  @ApiOperation({ summary: 'Get all active routes for passengers' })
  @ApiResponse({ status: 200, description: 'List of active routes returned.' })
  async findAllActiveRoutesForPassenger(): Promise<Route[]> {
    return this.routesService.findAllActiveRoutesForPassenger();
  }

  @Get('all-stops')
  @ApiOperation({ summary: 'Get all active stops from all routes' })
  async getAllActiveStops() {
    return this.routesService.findAllActiveStops();
  }

  @Get(':routeId') // GET /routes/{id} - details of one route
  @ApiOperation({ summary: 'Get details of an active route for passengers' })
  @ApiResponse({ status: 200, description: 'Route details returned.' })
  async findOneActiveRouteForPassenger(
    @Param('routeId', ParseUUIDPipe) routeId: string,
  ): Promise<Route> {
    return this.routesService.findOneActiveRouteForPassenger(routeId);
  }

  @Get(':routeId/stops')
  @ApiOperation({ summary: 'Get stops for a specific route' })
  @ApiResponse({ status: 200, description: 'List of stops for the route returned.' })
  async getRouteStops(
    @Param('routeId', ParseUUIDPipe) routeId: string,
  ): Promise<RouteStop[]> {
    const route =
      await this.routesService.findOneActiveRouteForPassenger(routeId); // Ensures route is active
    return route.stops; // Already filtered and sorted by service method
  }
}