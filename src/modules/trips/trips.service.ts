// src/modules/trips/trips.service.ts

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  MoreThanOrEqual,
  In,
  FindOptionsWhere,
  EntityManager,
  Brackets,
} from 'typeorm';
import { ScheduledTrip, TripStatus } from './entities/scheduled-trip.entity';
import { CreateScheduledTripDto } from './dto/create-scheduled-trip.dto';
import { UpdateScheduledTripDto } from './dto/update-scheduled-trip.dto';
import { ScheduledTripSlotDto } from './dto/scheduled-trip-slot.dto';
import {
  FindAvailableSlotsDto,
  TimeOfDay,
} from './dto/find-available-slots.dto';
import {
  TripSeatLayoutDto,
  UiSeat,
  SeatStatus,
} from './dto/trip-seat-layout.dto';
import { RoutesService } from '../routes/routes.service';
import { VehiclesService } from '../vehicles/vehicle.service';
import { UsersService } from '../users/users.service';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { User } from '../users/users.entity';
import { RouteStop, StopType } from '../routes/entities/route-stop.entity';
import { SimpleCarSeat } from '../vehicles/entities/vehicle-type.entity';
import {
  parseISO,
  startOfDay,
  endOfDay,
  setHours,
  isToday as datefnsIsToday,
  addMinutes,
  subMinutes,
  setMilliseconds,
  setSeconds,
  setMinutes,
  differenceInMinutes,
  addDays,
} from 'date-fns';
import { VehicleStatus } from '../vehicles/entities/vehicle.entity';
import { Route } from '../routes/entities/route.entity';
import { SearchTripsDto, TripLegSearchDto } from './dto/search-trips.dto';
import { DriversService } from '../drivers/drivers.service';
import { OptimizedRouteDto } from './dto/optimized-route.dto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { DriverTripStatusQuery } from './types/driver-trip-status.query.enum';
import { DriverRideItemDto } from './dto/driver-ride-item.dto';
import {
  TripSearchResponseDto,
  TripSearchResultItem,
} from './dto/trip-search-response.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);
  private googleApiKey: string;

  constructor(
    @InjectRepository(ScheduledTrip)
    private readonly tripRepository: Repository<ScheduledTrip>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RouteStop)
    private readonly routeStopRepository: Repository<RouteStop>,
    private readonly routesService: RoutesService,
    private readonly vehiclesService: VehiclesService,
    private readonly usersService: UsersService,
    private readonly driversService: DriversService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {
    this.logger.log('Constructing TripsService...');
    const apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');

    if (!apiKey) {
      this.logger.error(
        'CRITICAL FAILURE: GOOGLE_MAPS_API_KEY is not set in the .env file or configuration.',
      );
      throw new InternalServerErrorException(
        'Server configuration error: Missing Google Maps API Key.',
      );
    }

    this.googleApiKey = apiKey;
    this.logger.log('TripsService constructed successfully.');
  }

  // ... (all other functions remain exactly the same) ...
  public async searchForAvailableTrips(
    searchCriteria: SearchTripsDto,
  ): Promise<TripSearchResponseDto> {
    this.logger.log(
      `Starting trip search for type: ${searchCriteria.tripType}`,
    );

    const onwardTrips = await this.findAndFormatTripsForLeg(
      searchCriteria.onward,
    );

    let returnTrips: TripSearchResultItem[] = [];

    if (searchCriteria.tripType === 'roundtrip' && searchCriteria.return) {
      this.logger.log(`Searching for return trips...`);
      returnTrips = await this.findAndFormatTripsForLeg(searchCriteria.return);
    }

    return {
      onwardTrips,
      returnTrips,
    };
  }

    private async findAndFormatTripsForLeg(
    legCriteria: TripLegSearchDto,
  ): Promise<TripSearchResultItem[]> {
    const rawTrips = await this.findMatchingRawTrips(legCriteria);
    this.logger.log(`Found ${rawTrips.length} potential raw trips for leg.`);

    const formattedTrips = rawTrips
      .map((trip): TripSearchResultItem | null => {
        if (!trip.route || !trip.route.stops) {
          this.logger.warn(`Trip ${trip.id} is missing route or stops data.`);
          return null;
        }

        const originCoords = legCriteria.origin;
        const destCoords = legCriteria.destination;

        const pickupStop = this.findClosestStop(
          trip.route.stops,
          originCoords,
          [StopType.PICKUP, StopType.PICKUP_DROPOFF],
        );
        const dropoffStop = this.findClosestStop(
          trip.route.stops,
          destCoords,
          [StopType.DROPOFF, StopType.PICKUP_DROPOFF],
        );

        if (
          !pickupStop ||
          !dropoffStop ||
          pickupStop.sequence >= dropoffStop.sequence
        ) {
          return null;
        }

        const departure = new Date(trip.departureDateTime);
        const arrival = new Date(trip.estimatedArrivalDateTime);
        const durationMins = differenceInMinutes(arrival, departure);
        const hours = Math.floor(durationMins / 60);
        const minutes = durationMins % 60;
        const durationText = `${hours}h ${minutes}min`;

        const allStops = [...trip.route.stops]
          .sort((a, b) => a.sequence - b.sequence)
          .map((stop) => ({
            id: stop.id,
            name: stop.name,
            latitude: stop.location?.coordinates?.[1] || 0,
            longitude: stop.location?.coordinates?.[0] || 0,
            sequence: stop.sequence,
            type: stop.type,
          }));

        return {
          scheduledTripId: trip.id,
          routeName: trip.route.name,
          pickupStopId: pickupStop.id,
          destinationStopId: dropoffStop.id,
          pickupLocationName: pickupStop.name,
          destinationLocationName: dropoffStop.name,
          departureDateTime: trip.departureDateTime.toISOString(),
          estimatedArrivalDateTime: trip.estimatedArrivalDateTime.toISOString(),
          durationText: durationText,
          price: parseFloat(trip.pricePerSeat as any),
          currency: trip.currency,
          availableSeats: trip.currentAvailableSeats,
          vehicleInfo: {
            type: trip.vehicle.vehicleType.name,
            model: trip.vehicle.modelName || 'N/A',
            registrationNumber: trip.vehicle.registrationNumber,
          },
          stops: allStops,
        };
      })
      .filter((trip): trip is TripSearchResultItem => trip !== null);

    this.logger.log(
      `Returning ${formattedTrips.length} formatted trips for leg.`,
    );
    return formattedTrips;
  }
  private async findMatchingRawTrips(
    legCriteria: TripLegSearchDto,
  ): Promise<ScheduledTrip[]> {
    const qb = this.tripRepository.createQueryBuilder('trip');

    qb.innerJoinAndSelect('trip.route', 'route')
      .innerJoinAndSelect('route.stops', 'route_stops')
      .innerJoinAndSelect('trip.vehicle', 'vehicle')
      .innerJoinAndSelect('vehicle.vehicleType', 'vehicleType')
      .innerJoinAndSelect('trip.driver', 'driver');

    qb.where('trip.isActive = :isActive', { isActive: true })
      .andWhere('trip.status = :status', { status: 'scheduled' })
      .andWhere('trip.currentAvailableSeats > 0');

    if (legCriteria.date) {
      const searchDate = parseISO(legCriteria.date);
      const startDate = startOfDay(searchDate);
      const endDate = endOfDay(searchDate);
      qb.andWhere('trip.departureDateTime BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else {
      qb.andWhere('trip.departureDateTime >= :now', { now: new Date() });
    }

    const origin = legCriteria.origin;
    const destination = legCriteria.destination;
    const searchRadiusInMeters = 5000;

    qb.andWhere(
      'trip.routeId IN ' +
        qb
          .subQuery()
          .select('stops.routeId')
          .from(RouteStop, 'stops')
          .where(
            'ST_DWithin(stops.location, ST_SetSRID(ST_MakePoint(:originLng, :originLat), 4326)::geography, :radius)',
            {
              originLat: origin.latitude,
              originLng: origin.longitude,
              radius: searchRadiusInMeters,
            },
          )
          .andWhere(
            'stops.routeId IN ' +
              qb
                .subQuery()
                .select('dest_stops.routeId')
                .from(RouteStop, 'dest_stops')
                .where(
                  'ST_DWithin(dest_stops.location, ST_SetSRID(ST_MakePoint(:destLng, :destLat), 4326)::geography, :radius)',
                  {
                    destLat: destination.latitude,
                    destLng: destination.longitude,
                    radius: searchRadiusInMeters,
                  },
                )
                .getQuery(),
          )
          .getQuery(),
    );

    qb.orderBy('trip.departureDateTime', 'ASC');

    return qb.getMany();
  }

  public async findPublicTripById(id: string): Promise<ScheduledTrip> {
    this.logger.log(`[findPublicTripById] Fetching public details for trip ${id}`);
    const trip = await this.tripRepository.findOne({
      where: {
        id,
        isActive: true,
        status: In([TripStatus.SCHEDULED, TripStatus.FULL]),
      },
      relations: ['route', 'route.stops', 'vehicle', 'vehicle.vehicleType'],
    });

    if (!trip) {
      throw new NotFoundException(
        `Trip with ID ${id} not found or is not available.`,
      );
    }

    if (trip.route && Array.isArray(trip.route.stops)) {
      trip.route.stops.sort((a, b) => a.sequence - b.sequence);
    }
    return trip;
  }

  // ================== THIS FUNCTION IS NOW UPDATED ==================
  async startTrip(
    tripId: string,
    driverId: string,
  ): Promise<ScheduledTrip> {
    this.logger.log(
      `[startTrip] Attempting to start trip ${tripId} for driver ${driverId}`,
    );

    const trip = await this.tripRepository.findOneBy({
      id: tripId,
      driverId: driverId,
    });

    if (!trip) {
      const tripExists = await this.tripRepository.findOneBy({ id: tripId });
      if (tripExists) {
        this.logger.warn(
          `[startTrip] Forbidden attempt by driver ${driverId} on trip ${tripId} owned by driver ${tripExists.driverId}`,
        );
        throw new ForbiddenException(
          'You are not authorized to start this trip.',
        );
      }
      this.logger.warn(`[startTrip] Trip with ID ${tripId} not found.`);
      throw new NotFoundException(`Trip with ID ${tripId} not found.`);
    }

    if (
      trip.status !== TripStatus.SCHEDULED &&
      trip.status !== TripStatus.FULL
    ) {
      this.logger.warn(
        `[startTrip] Cannot start trip ${tripId}. Current status is '${trip.status}'`,
      );
      throw new BadRequestException(
        `Cannot start a trip with status '${trip.status}'. Only scheduled or full trips can be started.`,
      );
    }

    trip.status = TripStatus.ACTIVE;
    const updatedTrip = await this.tripRepository.save(trip);

    this.logger.log(
      `[startTrip] Successfully started trip ${tripId}. New status: ${updatedTrip.status}`,
    );
    
    // ++ THIS IS THE NEWLY ADDED LOGIC ++
    // After the trip is saved as ACTIVE, this line will trigger the notification process.
    await this.notifyPassengersOfTripStart(updatedTrip.id);
    // ++ END OF NEWLY ADDED LOGIC ++

    return updatedTrip;
  }
  
  // ================== THIS ENTIRE HELPER FUNCTION IS NEW ==================
  /**
   * Finds all passengers with confirmed bookings for a specific trip,
   * collects their FCM tokens, and sends a push notification.
   * @param tripId The ID of the trip that has just started.
   */
  private async notifyPassengersOfTripStart(tripId: string): Promise<void> {
    this.logger.log(`[notifyPassengers] Initializing notification process for started trip ${tripId}.`);
    
    // Step 1: Find all confirmed bookings for the given trip.
    // It's crucial to include the 'user' relation to access the fcmToken.
    const bookings = await this.bookingRepository.find({
      where: { 
        scheduledTripId: tripId,
        status: BookingStatus.CONFIRMED 
      },
      relations: ['user'], // This joins the users table and fetches the related user object.
    });

    // If there are no confirmed bookings, we can stop here.
    if (!bookings || bookings.length === 0) {
      this.logger.log(`[notifyPassengers] No confirmed bookings found for trip ${tripId}. No notifications will be sent.`);
      return;
    }

    // Step 2: Extract the valid FCM tokens from the users associated with the bookings.
    const passengerTokens = bookings
      .map(booking => booking.user?.fcmToken) // Get the token from each user
      .filter((token): token is string => !!token); // Filter out any users who don't have a token

    // Use a Set to ensure we only have unique tokens, in case a user has multiple bookings (unlikely but safe).
    const uniqueTokens = Array.from(new Set(passengerTokens));

    // Step 3: If we have tokens, compose and send the notification.
    if (uniqueTokens.length > 0) {
      const title = 'Your Ride Has Started!';
      const body = 'Your driver is now on the way to begin pickups. Please be ready!';
      const data = { 
        tripId: tripId,
        notificationType: 'TRIP_STARTED' 
      };
      
      this.logger.log(`[notifyPassengers] Sending "Trip Started" notification to ${uniqueTokens.length} unique device(s) for trip ${tripId}.`);
      
      // Call the injected NotificationsService to do the actual sending.
      await this.notificationsService.sendPushNotification(uniqueTokens, title, body, data);

    } else {
        this.logger.log(`[notifyPassengers] Found ${bookings.length} confirmed bookings, but none of the users had a registered FCM token.`);
    }
  }
  // ================== END OF NEW HELPER FUNCTION ==================

  private findClosestStop(
    stops: RouteStop[],
    coords: { latitude: number; longitude: number },
    allowedTypes: StopType[],
  ): RouteStop | null {
    let closestStop: RouteStop | null = null;
    let minDistance = Infinity;

    const distance = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number,
    ) => {
      const dLat = lat2 - lat1;
      const dLon = lon2 - lon1;
      return dLat * dLat + dLon * dLon;
    };

    for (const stop of stops) {
      if (allowedTypes.includes(stop.type) && stop.location?.coordinates) {
        const [stopLon, stopLat] = stop.location.coordinates;
        const d = distance(coords.latitude, coords.longitude, stopLat, stopLon);
        if (d < minDistance) {
          minDistance = d;
          closestStop = stop;
        }
      }
    }
    return closestStop;
  }

  private async checkVehicleConflict(
    vehicleId: string,
    departureDateTime: Date,
    estimatedArrivalDateTime: Date,
    excludeTripId?: string,
  ): Promise<void> {
    const bufferMinutes = 30;
    const conflictWindowStart = subMinutes(departureDateTime, bufferMinutes);
    const conflictWindowEnd = addMinutes(
      estimatedArrivalDateTime,
      bufferMinutes,
    );

    const queryBuilder = this.tripRepository
      .createQueryBuilder('trip')
      .where('trip.status IN (:...statuses)', {
        statuses: [
          TripStatus.SCHEDULED,
          TripStatus.ACTIVE,
          TripStatus.DELAYED,
        ],
      })
      .andWhere(
        '( (trip.departureDateTime <= :conflictWindowEnd AND trip.estimatedArrivalDateTime >= :conflictWindowStart) )',
        { conflictWindowStart, conflictWindowEnd },
      )
      .andWhere(
        new Brackets((qb) => {
          qb.where('trip.vehicleId = :vehicleId', { vehicleId });
        }),
      );

    if (excludeTripId) {
      queryBuilder.andWhere('trip.id != :excludeTripId', { excludeTripId });
    }

    const conflictingTrip = await queryBuilder.getOne();

    if (conflictingTrip) {
      throw new ConflictException(
        `Vehicle is already scheduled for another trip (ID: ${conflictingTrip.id}) that overlaps with this time slot (including buffer).`,
      );
    }
  }

  async create(dto: CreateScheduledTripDto): Promise<ScheduledTrip[]> {
    const {
      repeatDays = 1,
      departureDateTime: initialDepartureStr,
      estimatedArrivalDateTime: initialArrivalStr,
      ...tripCoreData
    } = dto;
    
    const route = await this.routesService.findOneRoute(tripCoreData.routeId);
    if (!route || route instanceof Error) {
      throw new NotFoundException(`Route with ID ${tripCoreData.routeId} not found.`);
    }
    if (!route.isActive) {
      throw new BadRequestException(`Route "${route.name}" is not active and cannot be scheduled.`);
    }

    const vehicle = await this.vehiclesService.findOne(tripCoreData.vehicleId);
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${tripCoreData.vehicleId} not found.`);
    }
    if (vehicle.status !== VehicleStatus.ACTIVE) {
      throw new BadRequestException(`Vehicle ${vehicle.registrationNumber} is not active and cannot be scheduled.`);
    }

    const driver = await this.driversService.findById(tripCoreData.driverId);
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${tripCoreData.driverId} not found.`);
    }
    
    const initialSeats = vehicle.effectivePassengerCapacity;
    if (initialSeats <= 0) {
      throw new BadRequestException(
        `Vehicle type "${vehicle.vehicleType.name}" has no bookable passenger capacity.`,
      );
    }

    const tripsToCreate: Partial<ScheduledTrip>[] = [];
    const initialDepartureDate = new Date(initialDepartureStr);
    const initialArrivalDate = new Date(initialArrivalStr);

    if (initialArrivalDate <= initialDepartureDate) {
      throw new BadRequestException('Estimated arrival time must be after departure time.');
    }
    if (initialDepartureDate < new Date()) {
      throw new BadRequestException('Initial departure time cannot be in the past.');
    }

    this.logger.log(`Preparing to create trip for ${repeatDays} day(s).`);
    for (let i = 0; i < repeatDays; i++) {
      const newDepartureDateTime = addDays(initialDepartureDate, i);
      const newEstimatedArrivalDateTime = addDays(initialArrivalDate, i);

      await this.checkVehicleConflict(
        tripCoreData.vehicleId,
        newDepartureDateTime,
        newEstimatedArrivalDateTime,
      );

      const tripForThisDay: Partial<ScheduledTrip> = {
        ...tripCoreData,
        departureDateTime: newDepartureDateTime,
        estimatedArrivalDateTime: newEstimatedArrivalDateTime,
        route: route,
        vehicle: vehicle,
        driver: driver,
        initialAvailableSeats: initialSeats,
        currentAvailableSeats: initialSeats,
        status: tripCoreData.status || TripStatus.SCHEDULED,
        isActive: tripCoreData.isActive !== undefined ? tripCoreData.isActive : true,
      };
      tripsToCreate.push(tripForThisDay);
    }

    this.logger.log(`Saving a batch of ${tripsToCreate.length} trips to the database.`);
    const tripEntities = this.tripRepository.create(tripsToCreate);
    return this.tripRepository.save(tripEntities);
  }

  async findAllForAdmin(queryParams?: {
    date?: string;
    routeId?: string;
    status?: TripStatus;
  }): Promise<ScheduledTrip[]> {
    const whereOptions: FindOptionsWhere<ScheduledTrip> = {};
    if (queryParams?.date) {
      const searchDate = parseISO(queryParams.date);
      whereOptions.departureDateTime = Between(
        startOfDay(searchDate),
        endOfDay(searchDate),
      );
    }
    if (queryParams?.routeId) whereOptions.routeId = queryParams.routeId;
    if (queryParams?.status) whereOptions.status = queryParams.status;

    return this.tripRepository.find({
      where: whereOptions,
      relations: ['route', 'vehicle', 'vehicle.vehicleType'],
      order: { departureDateTime: 'ASC' },
    });
  }

  async findOneForAdmin(id: string): Promise<ScheduledTrip> {
    const trip = await this.tripRepository.findOne({
      where: { id },
      relations: ['route', 'route.stops', 'vehicle', 'vehicle.vehicleType'],
    });
    if (!trip) {
      throw new NotFoundException(`Scheduled trip with ID ${id} not found.`);
    }
    if (trip.route && Array.isArray(trip.route.stops)) {
      trip.route.stops.sort((a, b) => a.sequence - b.sequence);
    }
    return trip;
  }

  async update(
    id: string,
    dto: UpdateScheduledTripDto,
  ): Promise<ScheduledTrip> {
    const tripToUpdate = await this.findOneForAdmin(id);

    const newDepartureDateTime = dto.departureDateTime
      ? new Date(dto.departureDateTime)
      : tripToUpdate.departureDateTime;
    const newEstimatedArrivalDateTime = dto.estimatedArrivalDateTime
      ? new Date(dto.estimatedArrivalDateTime)
      : tripToUpdate.estimatedArrivalDateTime;
    const newVehicleId = dto.vehicleId || tripToUpdate.vehicleId;

    if (newEstimatedArrivalDateTime <= newDepartureDateTime) {
      throw new BadRequestException(
        'Estimated arrival time must be after departure time.',
      );
    }
    if (
      dto.departureDateTime ||
      dto.estimatedArrivalDateTime ||
      dto.vehicleId
    ) {
      await this.checkVehicleConflict(
        newVehicleId,
        newDepartureDateTime,
        newEstimatedArrivalDateTime,
        id,
      );
    }

    let newInitialSeats = tripToUpdate.initialAvailableSeats;
    if (dto.vehicleId && dto.vehicleId !== tripToUpdate.vehicleId) {
      const newVehicle = await this.vehiclesService.findOne(dto.vehicleId);
      if (!newVehicle) {
        throw new NotFoundException(
          `Vehicle with ID ${dto.vehicleId} not found.`,
        );
      }
      if (newVehicle.status !== VehicleStatus.ACTIVE)
        throw new BadRequestException('New vehicle is not active.');
      newInitialSeats = newVehicle.effectivePassengerCapacity;
      const bookedSeatsCount =
        tripToUpdate.initialAvailableSeats -
        tripToUpdate.currentAvailableSeats;
      if (newInitialSeats < bookedSeatsCount) {
        throw new ConflictException(
          `New vehicle capacity (${newInitialSeats}) is less than already booked seats (${bookedSeatsCount}).`,
        );
      }
      if (dto.currentAvailableSeats === undefined) {
        dto.currentAvailableSeats = newInitialSeats - bookedSeatsCount;
      }
    }
    if (
      dto.currentAvailableSeats !== undefined &&
      dto.currentAvailableSeats > newInitialSeats
    ) {
      throw new BadRequestException(
        `Current available seats (${dto.currentAvailableSeats}) cannot exceed initial capacity (${newInitialSeats}).`,
      );
    }

    const preloadedTrip = await this.tripRepository.preload({
      id: id,
      ...dto,
      ...(dto.departureDateTime && {
        departureDateTime: new Date(dto.departureDateTime),
      }),
      ...(dto.estimatedArrivalDateTime && {
        estimatedArrivalDateTime: new Date(dto.estimatedArrivalDateTime),
      }),
      ...(dto.vehicleId && { initialAvailableSeats: newInitialSeats }),
    });

    if (!preloadedTrip)
      throw new NotFoundException('Trip not found for preload');

    if (dto.routeId) {
      const routeResult: Route | Error | null =
        await this.routesService.findOneRoute(dto.routeId);
      if (!routeResult || routeResult instanceof Error) {
        throw new NotFoundException(`Route with ID ${dto.routeId} not found.`);
      }
      preloadedTrip.route = routeResult;
    }
    if (dto.vehicleId) {
      const vehicleResult = await this.vehiclesService.findOne(dto.vehicleId);
      if (!vehicleResult || vehicleResult instanceof Error) {
        throw new NotFoundException(
          `Vehicle with ID ${dto.vehicleId} not found.`,
        );
      }
      preloadedTrip.vehicle = vehicleResult;
    }

    return this.tripRepository.save(preloadedTrip);
  }

  async remove(id: string): Promise<void> {
    const trip = await this.findOneForAdmin(id);
    const result = await this.tripRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(
        `Scheduled trip with ID ${id} not found during delete.`,
      );
    }
  }

  private getTimeRangeForQuery(
    date: Date,
    timePeriod: TimeOfDay,
  ): { start: Date; end: Date } {
    const baseDate = startOfDay(date);
    if (timePeriod === TimeOfDay.AM) {
      return {
        start: setHours(baseDate, 0),
        end: setMilliseconds(
          setSeconds(setMinutes(setHours(baseDate, 11), 59), 59),
          999,
        ),
      };
    } else {
      return {
        start: setHours(baseDate, 12),
        end: setMilliseconds(
          setSeconds(setMinutes(setHours(baseDate, 23), 59), 59),
          999,
        ),
      };
    }
  }

  async findAvailableSlotsForPassenger(
    dto: FindAvailableSlotsDto,
  ): Promise<ScheduledTripSlotDto[]> {
    const searchDate = parseISO(dto.date);
    const { start, end } = this.getTimeRangeForQuery(
      searchDate,
      dto.timePeriod,
    );
    const now = new Date();

    const queryBuilder = this.tripRepository
      .createQueryBuilder('trip')
      .innerJoinAndSelect('trip.route', 'route')
      .innerJoinAndSelect('route.stops', 'stop')
      .leftJoinAndSelect('trip.vehicle', 'vehicle')
      .leftJoinAndSelect('vehicle.vehicleType', 'vehicleType')
      .where('trip.isActive = :isActive', { isActive: true })
      .andWhere('trip.status = :status', { status: TripStatus.SCHEDULED })
      .andWhere('trip.currentAvailableSeats > 0')
      .andWhere('trip.departureDateTime BETWEEN :startRange AND :endRange', {
        startRange: start,
        endRange: end,
      });

    if (datefnsIsToday(searchDate) && start < now) {
      queryBuilder.andWhere('trip.departureDateTime >= :effectiveStartTime', {
        effectiveStartTime: start > now ? start : now,
      });
    }

    if (dto.routeId) {
      queryBuilder.andWhere('route.id = :routeId', { routeId: dto.routeId });
    }

    queryBuilder.orderBy('trip.departureDateTime', 'ASC');
    const trips = await queryBuilder.getMany();

    const validTrips: ScheduledTrip[] = [];
    for (const trip of trips) {
      const originStop = trip.route.stops.find(
        (s) => s.id === dto.originStopId && s.type !== StopType.DROPOFF,
      );
      const destinationStop = trip.route.stops.find(
        (s) => s.id === dto.destinationStopId && s.type !== StopType.PICKUP,
      );

      if (
        originStop &&
        destinationStop &&
        originStop.sequence < destinationStop.sequence
      ) {
        validTrips.push(trip);
      }
    }

    return validTrips
      .map((trip) => {
        const originStop = trip.route.stops.find(
          (s) => s.id === dto.originStopId,
        );
        const destinationStop = trip.route.stops.find(
          (s) => s.id === dto.destinationStopId,
        );
        if (originStop && destinationStop) {
          return new ScheduledTripSlotDto(trip, originStop, destinationStop);
        }
        return null;
      })
      .filter((tripDto): tripDto is ScheduledTripSlotDto => tripDto !== null);
  }

  async getTripSeatLayout(scheduledTripId: string): Promise<TripSeatLayoutDto> {
    this.logger.log(
      `[getTripSeatLayout] Starting for tripId: ${scheduledTripId}`,
    );
    try {
      const trip = await this.tripRepository.findOne({
        where: { id: scheduledTripId },
        relations: [
          'vehicle',
          'vehicle.vehicleType',
          'bookings',
          'bookings.user',
        ],
      });

      this.logger.log(`[getTripSeatLayout] Database query for trip completed.`);

      if (!trip) {
        this.logger.warn(
          `[getTripSeatLayout] Trip with ID ${scheduledTripId} NOT FOUND.`,
        );
        throw new NotFoundException(
          `Trip with ID ${scheduledTripId} not found.`,
        );
      }

      this.logger.log(
        `[getTripSeatLayout] Trip found. Checking for vehicle...`,
      );
      if (!trip.vehicle) {
        this.logger.error(
          `[getTripSeatLayout] CRITICAL: Trip ${trip.id} has NO associated vehicle.`,
        );
        throw new NotFoundException(
          'Associated vehicle details not found for this trip.',
        );
      }

      this.logger.log(
        `[getTripSeatLayout] Vehicle found (ID: ${trip.vehicle.id}). Checking for vehicle type...`,
      );
      if (!trip.vehicle.vehicleType) {
        this.logger.error(
          `[getTripSeatLayout] CRITICAL: Vehicle ${trip.vehicle.id} has NO associated vehicleType.`,
        );
        throw new NotFoundException(
          'Associated vehicle type details not found for this trip.',
        );
      }
      this.logger.log(
        `[getTripSeatLayout] Vehicle type found (Name: ${trip.vehicle.vehicleType.name}).`,
      );

      const vehicleType = trip.vehicle.vehicleType;
      const passengerCapacity = trip.vehicle.effectivePassengerCapacity;

      const tripBookings = trip.bookings.filter(
        (b) => b.status === BookingStatus.CONFIRMED,
      );

      this.logger.log(
        `[getTripSeatLayout] Found ${tripBookings.length} confirmed bookings for this trip.`,
      );

      const bookedSeatInfo = new Map<string, { gender?: string }>();
      tripBookings.forEach((booking) => {
        if (booking?.bookedSeatIds && booking.user) {
          for (const seatId of booking.bookedSeatIds) {
            bookedSeatInfo.set(seatId, { gender: booking.user.gender });
          }
        }
      });
      this.logger.log(
        `[getTripSeatLayout] Mapped ${bookedSeatInfo.size} booked seats to users.`,
      );

      const uiSeats: UiSeat[] = [];
      let seatIdentifiersSource: SimpleCarSeat[] =
        vehicleType.simpleSeatIdentifiers ?? [];

      if (seatIdentifiersSource.length === 0) {
        this.logger.log(
          `[getTripSeatLayout] No simpleSeatIdentifiers found. Generating seats based on capacity: ${passengerCapacity}`,
        );
        for (let i = 1; i <= passengerCapacity; i++) {
          seatIdentifiersSource.push({
            seatId: `S${i}`,
            description: `Seat ${i}`,
            isBookable: true,
          });
        }
      }

      for (const seatDef of seatIdentifiersSource) {
        let status = SeatStatus.UNAVAILABLE;
        if (seatDef.isBookable) {
          status = SeatStatus.AVAILABLE;
          if (bookedSeatInfo.has(seatDef.seatId)) {
            const bookingUserGender = bookedSeatInfo.get(
              seatDef.seatId,
            )?.gender;
            status =
              bookingUserGender?.toLowerCase() === 'male'
                ? SeatStatus.RESERVED_MALE
                : bookingUserGender?.toLowerCase() === 'female'
                ? SeatStatus.RESERVED_FEMALE
                : SeatStatus.BOOKED;
          }
        }
        uiSeats.push({
          seatId: seatDef.seatId,
          seatNumber: seatDef.seatId,
          description: seatDef.description,
          status: status,
          isBookable: seatDef.isBookable,
        });
      }

      this.logger.log(
        `[getTripSeatLayout] Successfully processed ${uiSeats.length} seats. Preparing final DTO.`,
      );
      return {
        scheduledTripId: trip.id,
        totalPassengerSeats: passengerCapacity,
        currentAvailableSeats: trip.currentAvailableSeats,
        seats: uiSeats,
      };
    } catch (error) {
      this.logger.error(
        `[getTripSeatLayout] An unhandled error occurred for tripId ${scheduledTripId}`,
        error.stack,
        'TripsService',
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'A server error occurred while fetching the seat layout.',
      );
    }
  }

  async decreaseAvailableSeats(
    tripId: string,
    numSeats: number,
    manager: EntityManager,
  ): Promise<void> {
    const tripRepository = manager.getRepository(ScheduledTrip);

    const updateResult = await tripRepository.decrement(
      { id: tripId },
      'currentAvailableSeats',
      numSeats,
    );

    if (updateResult.affected === 0) {
      return;
    }

    const trip = await tripRepository.findOneBy({ id: tripId });

    if (trip) {
      if (trip.currentAvailableSeats <= 0) {
        if (trip.status !== TripStatus.FULL) {
          trip.currentAvailableSeats = 0;
          trip.status = TripStatus.FULL;
          try {
            await tripRepository.save(trip);
          } catch (error) {
            this.logger.error(
              `Failed to update trip status for trip ${tripId} after seat decrement.`,
              error.stack,
            );
            throw new InternalServerErrorException(
              'Failed to update trip status after seat decrement.',
            );
          }
        }
      }
    }
  }

  async increaseAvailableSeats(
    tripId: string,
    numSeatsCancelled: number,
    transactionalEntityManager: EntityManager,
  ): Promise<ScheduledTrip> {
    const trip = await this.tripRepository.findOneBy({ id: tripId });
    if (!trip)
      throw new NotFoundException('Trip not found for seat adjustment.');

    trip.currentAvailableSeats += numSeatsCancelled;
    if (trip.currentAvailableSeats > trip.initialAvailableSeats) {
      trip.currentAvailableSeats = trip.initialAvailableSeats;
    }
    if (trip.status === TripStatus.FULL && trip.currentAvailableSeats > 0) {
      trip.status = TripStatus.SCHEDULED;
    }
    return this.tripRepository.save(trip);
  }

  async findTripsForDriver(driverId: string): Promise<ScheduledTrip[]> {
    return this.tripRepository.find({ where: { driverId } });
  }

  async findDriverRides(
    driverId: string,
    status: DriverTripStatusQuery,
  ): Promise<DriverRideItemDto[]> {
    this.logger.log(
      `Fetching rides for driver ${driverId} with status ${status}`,
    );
    const whereOptions: FindOptionsWhere<ScheduledTrip> = { driverId };
    let orderOptions: { [key: string]: 'ASC' | 'DESC' } = {
      departureDateTime: 'DESC',
    };

    switch (status) {
      case DriverTripStatusQuery.UPCOMING:
        whereOptions.status = In([
          TripStatus.SCHEDULED,
          TripStatus.FULL,
          TripStatus.ACTIVE,
          TripStatus.DELAYED,
        ]);
        whereOptions.departureDateTime = MoreThanOrEqual(new Date());
        orderOptions = { departureDateTime: 'ASC' };
        break;

      case DriverTripStatusQuery.COMPLETED:
        whereOptions.status = TripStatus.COMPLETED;
        break;

      case DriverTripStatusQuery.CANCELLED:
        whereOptions.status = TripStatus.CANCELLED;
        orderOptions = { updatedAt: 'DESC' };
        break;
    }

    const trips = await this.tripRepository.find({
      where: whereOptions,
      relations: [
        'route',
        'route.stops', 
        'vehicle',
        'vehicle.vehicleType',
        'bookings',
        'bookings.pickupStop',
        'bookings.dropOffStop',
      ],
      order: orderOptions,
    });

    this.logger.log(
      `Found ${trips.length} rides for driver ${driverId} with status ${status}. Mapping to DTO.`,
    );

    return trips.map((trip) => new DriverRideItemDto(trip));
  }

  async getDriverDashboardTripInfo(driverId: string) {
    const now = new Date();

    const nextUpcomingTrip = await this.tripRepository.findOne({
      where: {
        driverId,
        status: In([TripStatus.SCHEDULED, TripStatus.FULL]),
        departureDateTime: MoreThanOrEqual(now),
      },
      order: { departureDateTime: 'ASC' },
      relations: ['route', 'route.stops'],
    });

    const upcomingCount = await this.tripRepository.count({
      where: {
        driverId,
        status: In([TripStatus.SCHEDULED, TripStatus.FULL]),
        departureDateTime: MoreThanOrEqual(now),
      },
    });
    const completedTodayCount = await this.tripRepository.count({
      where: {
        driverId,
        status: TripStatus.COMPLETED,
        departureDateTime: Between(startOfDay(now), endOfDay(now)),
      },
    });
    const cancelledTodayCount = await this.tripRepository.count({
      where: {
        driverId,
        status: TripStatus.CANCELLED,
        updatedAt: Between(startOfDay(now), endOfDay(now)),
      },
    });

    const completedTripsToday = await this.tripRepository.find({
      where: {
        driverId,
        status: TripStatus.COMPLETED,
        departureDateTime: Between(startOfDay(now), endOfDay(now)),
      },
      select: ['departureDateTime', 'estimatedArrivalDateTime'],
    });
    let hoursDrivenToday = 0;
    for (const trip of completedTripsToday) {
      if (trip.departureDateTime && trip.estimatedArrivalDateTime) {
        const ms =
          new Date(trip.estimatedArrivalDateTime).getTime() -
          new Date(trip.departureDateTime).getTime();
        hoursDrivenToday += ms / (1000 * 60 * 60);
      }
    }
    hoursDrivenToday = Math.round(hoursDrivenToday * 100) / 100;

    return {
      nextUpcomingTrip,
      tripSummaryCounts: {
        upcoming: upcomingCount,
        completedToday: completedTodayCount,
        cancelledToday: cancelledTodayCount,
      },
      todaysStats: {
        rides: completedTodayCount,
        hours: hoursDrivenToday,
      },
    };
  }

  async getOptimizedPickupRoute(
    driverId: string,
    tripId: string,
    driverLocation: { latitude: number; longitude: number },
  ): Promise<OptimizedRouteDto> {
    const trip = await this.tripRepository.findOneBy({ id: tripId, driverId });
    if (!trip) {
      throw new NotFoundException(
        'Trip not found or you are not assigned to it.',
      );
    }

    const bookings = await this.bookingRepository.find({
      where: { scheduledTripId: tripId, status: BookingStatus.CONFIRMED },
      relations: ['pickupStop'],
    });

    if (bookings.length === 0) {
      throw new BadRequestException('No passengers have booked this trip yet.');
    }

    const uniqueStops = [
      ...new Map(
        bookings.map((b) => [b.pickupStop.id, b.pickupStop]),
      ).values(),
    ];
    uniqueStops.sort((a, b) => a.sequence - b.sequence);

    const origin = `${driverLocation.latitude},${driverLocation.longitude}`;
    const destinationStop = uniqueStops[uniqueStops.length - 1];
    if (destinationStop.latitude == null || destinationStop.longitude == null) {
      throw new InternalServerErrorException(
        'Destination stop is missing latitude or longitude.',
      );
    }
    const destination = `${destinationStop.latitude},${destinationStop.longitude}`;
    const waypointsArr = uniqueStops.slice(0, -1);
    for (const stop of waypointsArr) {
      if (stop.latitude == null || stop.longitude == null) {
        throw new InternalServerErrorException(
          'A waypoint stop is missing latitude or longitude.',
        );
      }
    }
    const waypoints = waypointsArr
      .map((stop) => `${stop.latitude},${stop.longitude}`)
      .join('|');
    const optimizeWaypoints = 'optimize:true|';

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=${optimizeWaypoints}${waypoints}&key=${this.googleApiKey}`;

    this.logger.debug(`[Google Directions API] Requesting URL: ${url}`);
    try {
      const response = await firstValueFrom(this.httpService.get(url));
      const directions = response.data;

      if (directions.status !== 'OK') {
        throw new InternalServerErrorException(
          `Google Directions API error: ${directions.status} - ${
            directions.error_message || ''
          }`,
        );
      }

      const route = directions.routes[0];
      const legOrder = route.waypoint_order;

      const intermediateStops = uniqueStops.slice(0, -1);
      const orderedWaypoints: { latitude: number; longitude: number }[] =
        legOrder.map((index) => {
          const stop = intermediateStops[index];
          return {
            latitude: stop.latitude!,
            longitude: stop.longitude!,
          };
        });
      orderedWaypoints.push({
        latitude: destinationStop.latitude!,
        longitude: destinationStop.longitude!,
      });

      return {
        polyline: route.overview_polyline.points,
        waypoints: orderedWaypoints,
        totalDistance: route.legs.reduce(
          (sum, leg) => sum + (leg.distance?.value || 0),
          0,
        ),
      };
    } catch (error) {
      this.logger.error(
        'Error calling Google Directions API:',
        error.stack,
        'getOptimizedPickupRoute',
      );
      throw new InternalServerErrorException(
        'Failed to calculate optimized route.',
      );
    }
  }
}