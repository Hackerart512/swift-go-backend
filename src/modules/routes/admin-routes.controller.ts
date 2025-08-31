// src/modules/routes/admin-routes.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { Route } from './entities/route.entity';
import { CreateRouteStopDto } from './dto/create-route-stop.dto';
import { UpdateRouteStopDto } from './dto/update-route-stop.dto';
import { RouteStop } from './entities/route-stop.entity';

@ApiTags('Admin: Routes')
@Controller('admin/routes') // This sets the base path to /admin/routes
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class AdminRoutesController {
  constructor(private readonly routesService: RoutesService) {}

  // GET /admin/routes - This is the endpoint your admin panel is looking for.
  @Get()
  @ApiOperation({ summary: 'Get all routes for admin panel' })
  @ApiResponse({ status: 200, description: 'List of all routes.' })
  async findAllForAdmin(): Promise<Route[]> {
    // We will create this new service method next
    return this.routesService.findAllForAdmin();
  }

  // GET /admin/routes/:routeId - To view/edit a single route
  @Get(':routeId')
  @ApiOperation({ summary: 'Get a single route by ID for admin' })
  @ApiResponse({ status: 200, description: 'Route details.' })
  async findOneForAdmin(
    @Param('routeId', ParseUUIDPipe) routeId: string,
  ): Promise<Route> {
    // We will create this new service method next
    return this.routesService.findOneForAdmin(routeId);
  }

  // POST /admin/routes
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new route' })
  @ApiResponse({ status: 201, description: 'Route created.' })
  async createRoute(@Body() createRouteDto: CreateRouteDto): Promise<Route> {
    return this.routesService.createRoute(createRouteDto);
  }

  // PATCH /admin/routes/:routeId
  @Patch(':routeId')
  @ApiOperation({ summary: 'Update a route' })
  @ApiResponse({ status: 200, description: 'Route updated.' })
  async updateRoute(
    @Param('routeId', ParseUUIDPipe) routeId: string,
    @Body() updateRouteDto: UpdateRouteDto,
  ): Promise<Route> {
    return this.routesService.updateRoute(routeId, updateRouteDto);
  }

  // DELETE /admin/routes/:routeId
  @Delete(':routeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a route' })
  @ApiResponse({ status: 204, description: 'Route deleted.' })
  async deleteRoute(
    @Param('routeId', ParseUUIDPipe) routeId: string,
  ): Promise<void> {
    return this.routesService.deleteRoute(routeId);
  }

  // --- Admin: Route Stop Management ---

  // POST /admin/routes/:routeId/stops
  @Post(':routeId/stops')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a stop to a route' })
  @ApiResponse({ status: 201, description: 'Stop added to route.' })
  async addStopToRoute(
    @Param('routeId', ParseUUIDPipe) routeId: string,
    @Body() createStopDto: CreateRouteStopDto,
  ): Promise<RouteStop> {
    return this.routesService.addStopToRoute(routeId, createStopDto);
  }
  
  // PATCH /admin/routes/stops/:stopId
  @Patch('stops/:stopId')
  @ApiOperation({ summary: 'Update a route stop' })
  @ApiResponse({ status: 200, description: 'Route stop updated.' })
  async updateRouteStop(
    @Param('stopId', ParseUUIDPipe) stopId: string,
    @Body() updateStopDto: UpdateRouteStopDto,
  ): Promise<RouteStop> {
    return this.routesService.updateStopOnRoute(stopId, updateStopDto);
  }

  // DELETE /admin/routes/stops/:stopId
  @Delete('stops/:stopId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a route stop' })
  @ApiResponse({ status: 204, description: 'Route stop deleted.' })
  async deleteRouteStop(
    @Param('stopId', ParseUUIDPipe) stopId: string,
  ): Promise<void> {
    return this.routesService.removeStopFromRoute(stopId);
  }
}