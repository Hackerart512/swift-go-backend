  // src/modules/routes/routes.service.ts

  /* eslint-disable @typescript-eslint/no-unused-vars */
  import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository, EntityManager, MoreThan, Brackets } from 'typeorm';
  import { Route } from './entities/route.entity';
  import { RouteStop } from './entities/route-stop.entity';
  import { CreateRouteDto } from './dto/create-route.dto';
  import { UpdateRouteDto } from './dto/update-route.dto';
  import { CreateRouteStopDto } from './dto/create-route-stop.dto';
  import { UpdateRouteStopDto } from './dto/update-route-stop.dto';
  import { ScheduledTrip } from '../trips/entities/scheduled-trip.entity';

  @Injectable()
  export class RoutesService {
    constructor(
      @InjectRepository(Route)
      private readonly routeRepository: Repository<Route>,
      @InjectRepository(RouteStop)
      private readonly routeStopRepository: Repository<RouteStop>,
      @InjectRepository(ScheduledTrip)
      private readonly scheduledTripRepository: Repository<ScheduledTrip>,
      private readonly entityManager: EntityManager,
    ) {}

    // ================================================================= //
    // =================== ADMIN-FACING METHODS ======================== //
    // ================================================================= //
    async findAllForAdmin(): Promise<Route[]> {
      return this.routeRepository.find({ relations: ['stops'], order: { name: 'ASC' } });
    }
    
    async findOneForAdmin(id: string): Promise<Route> {
      const route = await this.routeRepository.findOne({ where: { id }, relations: ['stops'] });
      if (!route) {
        throw new NotFoundException(`Route with ID ${id} not found`);
      }
      route.stops.sort((a, b) => a.sequence - b.sequence);
      return route;
    }

    async createRoute(createRouteDto: CreateRouteDto): Promise<Route> {
      const { stops: stopDtos, ...routeData } = createRouteDto;
      const existingRoute = await this.routeRepository.findOne({ where: { name: routeData.name } });
      if (existingRoute) {
        throw new ConflictException(`Route with name "${routeData.name}" already exists.`);
      }
      return this.entityManager.transaction(async (transactionalEntityManager) => {
        const routeEntity = transactionalEntityManager.create(Route, routeData);
        const savedRoute = await transactionalEntityManager.save(routeEntity);
        if (stopDtos && stopDtos.length > 0) {
          const stopEntities = stopDtos.map((dto) =>
            transactionalEntityManager.create(RouteStop, { ...dto, routeId: savedRoute.id, location: dto.latitude !== undefined && dto.longitude !== undefined ? { type: 'Point' as const, coordinates: [dto.longitude, dto.latitude] } : undefined }),
          );
          await transactionalEntityManager.save(RouteStop, stopEntities);
        }
        const result = await transactionalEntityManager.findOneOrFail(Route, { where: { id: savedRoute.id }, relations: ['stops'] });
        result.stops.sort((a, b) => a.sequence - b.sequence);
        return result;
      });
    }

    async updateRoute(id: string, updateRouteDto: UpdateRouteDto): Promise<Route> {
      const { stops: stopDtos, ...routeData } = updateRouteDto;
      const route = await this.routeRepository.findOne({ where: { id }, relations: ['stops'] });
      if (!route) {
        throw new NotFoundException(`Route with ID ${id} not found`);
      }
      if (routeData.name && routeData.name !== route.name) {
        const existingName = await this.routeRepository.findOne({ where: { name: routeData.name } });
        if (existingName && existingName.id !== id) {
          throw new ConflictException(`Another route with name "${routeData.name}" already exists.`);
        }
      }
      this.routeRepository.merge(route, routeData);
      return this.entityManager.transaction(async (transactionalEntityManager) => {
        const updatedRoute = await transactionalEntityManager.save(Route, route);
        if (stopDtos !== undefined) {
          await transactionalEntityManager.delete(RouteStop, { routeId: route.id });
          if (stopDtos.length > 0) {
            const newStopEntities = stopDtos.map((dto) =>
              transactionalEntityManager.create(RouteStop, { ...dto, routeId: updatedRoute.id, location: dto.latitude !== undefined && dto.longitude !== undefined ? { type: 'Point' as const, coordinates: [dto.longitude, dto.latitude] } : undefined }),
            );
            await transactionalEntityManager.save(RouteStop, newStopEntities);
          }
        }
        const result = await transactionalEntityManager.findOneOrFail(Route, { where: { id: updatedRoute.id }, relations: ['stops'] });
        result.stops.sort((a, b) => a.sequence - b.sequence);
        return result;
      });
    }

    async deleteRoute(id: string): Promise<void> {
      const route = await this.routeRepository.findOneBy({ id });
      if (!route) {
        throw new NotFoundException(`Route with ID ${id} not found`);
      }
      const futureTripsCount = await this.scheduledTripRepository.count({
        where: { routeId: id, departureDateTime: MoreThan(new Date()) },
      });
      if (futureTripsCount > 0) {
        throw new BadRequestException(`Cannot delete this route as it has ${futureTripsCount} upcoming scheduled trips. Please handle them first.`);
      }
      route.isActive = false;
      await this.routeRepository.save(route);
    }

    async addStopToRoute(routeId: string, createStopDto: CreateRouteStopDto): Promise<RouteStop> {
      const route = await this.routeRepository.findOneBy({ id: routeId });
      if (!route) throw new NotFoundException(`Route with ID ${routeId} not found.`);
      const existingStopAtSequence = await this.routeStopRepository.findOne({ where: { routeId, sequence: createStopDto.sequence } });
      if (existingStopAtSequence) throw new ConflictException(`A stop already exists at sequence ${createStopDto.sequence} for this route.`);
      const newStopEntity = this.routeStopRepository.create({ ...createStopDto, route, location: { type: 'Point' as const, coordinates: [createStopDto.longitude, createStopDto.latitude] } });
      return this.routeStopRepository.save(newStopEntity);
    }

    async updateStopOnRoute(stopId: string, updateStopDto: UpdateRouteStopDto): Promise<RouteStop> {
      const stop = await this.routeStopRepository.preload({ id: stopId, ...updateStopDto });
      if (!stop) throw new NotFoundException(`Stop with ID ${stopId} not found.`);
      if (updateStopDto.sequence && updateStopDto.sequence !== stop.sequence) {
        const existingStopAtSequence = await this.routeStopRepository.createQueryBuilder('rs').where('rs.routeId = :routeId', { routeId: stop.routeId }).andWhere('rs.sequence = :sequence', { sequence: updateStopDto.sequence }).andWhere('rs.id != :stopId', { stopId }).getOne();
        if (existingStopAtSequence) throw new ConflictException(`Another stop already exists at sequence ${updateStopDto.sequence} for this route.`);
      }
      return this.routeStopRepository.save(stop);
    }

    async removeStopFromRoute(stopId: string): Promise<void> {
      const result = await this.routeStopRepository.delete(stopId);
      if (result.affected === 0) throw new NotFoundException(`Stop with ID ${stopId} not found.`);
    }

    // =================================================================== //
    // =================== PASSENGER-FACING METHODS ====================== //
    // =================================================================== //
    async findAllActiveRoutesForPassenger(): Promise<Route[]> {
      return this.routeRepository.find({ where: { isActive: true }, relations: ['stops'], order: { name: 'ASC' } });
    }

    async findOneActiveRouteForPassenger(id: string): Promise<Route> {
      const route = await this.routeRepository.findOne({ where: { id, isActive: true }, relations: ['stops'] });
      if (!route) {
        throw new NotFoundException(`Route with ID ${id} not found or is not active.`);
      }
      route.stops = route.stops.filter((stop) => stop.isActive).sort((a, b) => a.sequence - b.sequence);
      return route;
    }

    async findOneRoute(id: string): Promise<Route | null> {
      return this.routeRepository.findOne({ where: { id }, relations: ['stops'] });
    }

    // ======================== THE FIX IS HERE ========================
    async findRouteContainingStops(pickupStopId: string, dropOffStopId: string): Promise<Route | null> {
      // This query finds a route where there is a pickup stop with the first ID
      // AND a dropoff stop with the second ID on the SAME route,
      // AND the pickup sequence number is less than the dropoff sequence number.
      // This is all done in a single, efficient database query.
      return this.routeRepository.createQueryBuilder('route')
        .innerJoin('route.stops', 'pickup_stop')
        .innerJoin('route.stops', 'dropoff_stop')
        .where('route.isActive = :isActive', { isActive: true })
        .andWhere('pickup_stop.id = :pickupStopId', { pickupStopId })
        .andWhere('dropoff_stop.id = :dropOffStopId', { dropOffStopId })
        .andWhere('pickup_stop.sequence < dropoff_stop.sequence')
        .getOne();
    }
    // ==================================================================

    async findAllActiveStops(): Promise<RouteStop[]> {
      return this.routeStopRepository.find({ where: { isActive: true }, order: { name: 'ASC' } });
    }

    async findNearestStop(
      coordinates: { latitude: number; longitude: number },
      stopType: 'pickup' | 'dropoff',
      radiusInMeters: number,
    ): Promise<RouteStop | null> {
      const { latitude, longitude } = coordinates;
      const originPoint = `POINT(${longitude} ${latitude})`;
      const queryBuilder = this.routeStopRepository.createQueryBuilder("stop")
        .where("stop.isActive = true")
        .andWhere(new Brackets(qb => {
            qb.where('stop.type = :stopType', { stopType });
            qb.orWhere('stop.type = :pickupDropoff', { pickupDropoff: 'pickup_dropoff' });
          }))
        .andWhere("ST_DWithin(stop.location, ST_GeomFromText(:originPoint, 4326)::geography, :radius)", {
          originPoint,
          radius: radiusInMeters,
        })
        .orderBy("ST_Distance(stop.location, ST_GeomFromText(:originPoint, 4326)::geography)", "ASC")
        .limit(1);
      return queryBuilder.getOne();
    }
  }