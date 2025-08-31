// src/modules/bookings/bookings.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, DataSource } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import {
  CreateBookingDto,
  PaymentMethodType,
  BookingTripType,
} from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { User, KycStatus } from '../users/users.entity';
import {
  ScheduledTrip,
  TripStatus,
} from '../trips/entities/scheduled-trip.entity';
import { TripsService } from '../trips/trips.service';
import { UsersService } from '../users/users.service';
import { UserSubscriptionsService } from '../user-subscriptions/user-subscriptions.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { MyRideDetailDto } from './dto/my-ride-detail.dto';
import { generate } from 'otp-generator';
import { addMinutes, differenceInHours } from 'date-fns';
import {
  CancelBookingDto,
  CancellationReasonCode,
} from './dto/cancel-booking.dto';
import { PassengerForTripDto } from './dto/passenger-for-trip.dto';
import { DeclineBookingDto } from './dto/decline-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly tripsService: TripsService,
    private readonly usersService: UsersService,
    private readonly userSubscriptionsService: UserSubscriptionsService,
    private readonly dataSource: DataSource,
    private readonly entityManager: EntityManager,
  ) {}

  async createBooking(
    userId: string,
    dto: CreateBookingDto,
  ): Promise<{ onwardBooking: Booking; returnBooking: Booking | null }> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const user = await transactionalEntityManager
        .getRepository(User)
        .findOneBy({ id: userId });
      if (!user) throw new NotFoundException('User not found.');
      if (!user.isActive)
        throw new ForbiddenException('User account is not active.');

      const onwardBooking = await this.createSingleLegBooking(
        userId,
        user,
        {
          scheduledTripId: dto.onwardScheduledTripId,
          pickupStopId: dto.onwardPickupStopId,
          dropOffStopId: dto.onwardDropOffStopId,
          selectedSeatIds: dto.onwardSelectedSeatIds,
        },
        dto,
        transactionalEntityManager,
      );

      let returnBooking: Booking | null = null;

      if (dto.tripType === BookingTripType.ROUNDTRIP) {
        if (
          !dto.returnScheduledTripId ||
          !dto.returnPickupStopId ||
          !dto.returnDropOffStopId ||
          !dto.returnSelectedSeatIds
        ) {
          throw new BadRequestException(
            'All return trip details are required for a round-trip booking.',
          );
        }

        returnBooking = await this.createSingleLegBooking(
          userId,
          user,
          {
            scheduledTripId: dto.returnScheduledTripId,
            pickupStopId: dto.returnPickupStopId,
            dropOffStopId: dto.returnDropOffStopId,
            selectedSeatIds: dto.returnSelectedSeatIds,
          },
          dto,
          transactionalEntityManager,
        );
      }

      return {
        onwardBooking,
        returnBooking,
      };
    });
  }

  private async createSingleLegBooking(
    userId: string,
    user: User,
    legDto: {
      scheduledTripId: string;
      pickupStopId: string;
      dropOffStopId: string;
      selectedSeatIds: string[];
    },
    paymentDto: CreateBookingDto,
    manager: EntityManager,
  ): Promise<Booking> {
    const bookingRepo = manager.getRepository(Booking);

    const trip = await this.validateAndLockTrip(
      legDto.scheduledTripId,
      legDto.pickupStopId,
      legDto.dropOffStopId,
      legDto.selectedSeatIds,
      manager,
    );

    const pickupStop = trip.route.stops.find(
      (s) => s.id === legDto.pickupStopId,
    );
    const dropOffStop = trip.route.stops.find(
      (s) => s.id === legDto.dropOffStopId,
    );

    const numberOfSeatsRequested = legDto.selectedSeatIds.length;
    const baseFarePerSeat = Number(trip.pricePerSeat);
    const calculatedTotalFare = baseFarePerSeat * numberOfSeatsRequested;

    const paymentDetails = await this.determinePayment(
      userId,
      calculatedTotalFare,
      paymentDto,
      manager,
    );

    const newBooking = bookingRepo.create({
      user,
      crn: this.generateCrn(),
      scheduledTrip: trip,
      tripDepartureDateTime: trip.departureDateTime,
      pickupStop,
      dropOffStop,
      bookedSeatIds: legDto.selectedSeatIds,
      numberOfSeatsBooked: numberOfSeatsRequested,
      baseFare: calculatedTotalFare,
      totalFarePaid: paymentDetails.amount,
      currency: trip.currency,
      status: BookingStatus.CONFIRMED,
      paymentDetails,
      boardingOtp: generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      }),
      boardingOtpExpiresAt: addMinutes(trip.departureDateTime, 30),
    });

    const savedBooking = await bookingRepo.save(newBooking);

    await this.tripsService.decreaseAvailableSeats(
      trip.id,
      savedBooking.numberOfSeatsBooked,
      manager,
    );

    return (await bookingRepo.findOne({
      where: { id: savedBooking.id },
      relations: [
        'user',
        'scheduledTrip',
        'scheduledTrip.route',
        'scheduledTrip.vehicle',
        'scheduledTrip.vehicle.vehicleType',
        'pickupStop',
        'dropOffStop',
      ],
    }))!;
  }

  private async determinePayment(
    userId: string,
    amount: number,
    dto: CreateBookingDto,
    manager: EntityManager,
  ): Promise<NonNullable<Booking['paymentDetails']>> {
    if (amount <= 0) {
      return {
        gateway: 'promotional',
        status: 'success',
        amount: 0,
        transactionId: `PROMO_FREE_${Date.now()}`,
      };
    }

    switch (dto.paymentMethod) {
      case PaymentMethodType.SWIFTGO_BALANCE:
        const walletDeduction = await this.usersService.deductFromWallet(
          userId,
          amount,
          manager,
        );
        if (!walletDeduction.success)
          throw new ForbiddenException(
            walletDeduction.message || 'Insufficient wallet balance.',
          );
        return {
          gateway: 'swiftgo_balance',
          status: 'success',
          amount,
          transactionId: `WALLET_TXN_${Date.now()}`,
        };
      case PaymentMethodType.CASH:
        return {
          gateway: 'cash',
          status: 'success',
          amount,
          transactionId: `CASH_BOOKING_${Date.now()}`,
        };
      default:
        return {
          gateway: dto.paymentMethod.toString(),
          status: 'success',
          amount,
          transactionId:
            dto.paymentGatewayReferenceId || `MOCK_EXT_${Date.now()}`,
        };
    }
  }

  private async validateAndLockTrip(
    tripId: string,
    pickupStopId: string,
    dropOffStopId: string,
    selectedSeatIds: string[],
    manager: EntityManager,
  ): Promise<ScheduledTrip> {
    const trip = await manager
      .createQueryBuilder(ScheduledTrip, 'trip')
      .innerJoinAndSelect('trip.route', 'route')
      .leftJoinAndSelect('route.stops', 'routeStops')
      .innerJoinAndSelect('trip.vehicle', 'vehicle')
      .innerJoinAndSelect('vehicle.vehicleType', 'vehicleType')
      .where('trip.id = :tripId', { tripId })
      .setLock('pessimistic_write', undefined, ['trip'])
      .getOne();
    if (!trip)
      throw new NotFoundException(
        `Scheduled trip with ID ${tripId} not found.`,
      );
    if (!trip.isActive || trip.status !== TripStatus.SCHEDULED)
      throw new BadRequestException(
        `Trip ${tripId} is not active or available for booking.`,
      );
    const pickupStop = trip.route.stops.find((s) => s.id === pickupStopId);
    const dropOffStop = trip.route.stops.find((s) => s.id === dropOffStopId);
    if (
      !pickupStop ||
      !dropOffStop ||
      pickupStop.sequence >= dropOffStop.sequence
    )
      throw new BadRequestException(
        `Invalid stops or sequence for trip ${tripId}.`,
      );
    if (selectedSeatIds.length > trip.currentAvailableSeats)
      throw new ConflictException(
        `Not enough seats on trip ${tripId}. Requested: ${selectedSeatIds.length}, Available: ${trip.currentAvailableSeats}`,
      );
    const existingBookingsForTrip = await manager.find(Booking, {
      where: { scheduledTripId: trip.id, status: BookingStatus.CONFIRMED },
    });
    const allBookedSeatIds = existingBookingsForTrip.flatMap(
      (b) => b.bookedSeatIds,
    );
    for (const seatId of selectedSeatIds) {
      if (allBookedSeatIds.includes(seatId))
        throw new ConflictException(
          `Seat ID "${seatId}" on trip ${tripId} is already booked.`,
        );
    }
    return trip;
  }

  async findAllForAdmin(query: any): Promise<Booking[]> {
    return this.bookingRepository.find({
      relations: ['user', 'scheduledTrip', 'scheduledTrip.route'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneForAdmin(bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: [
        'user',
        'scheduledTrip',
        'scheduledTrip.route',
        'scheduledTrip.route.stops',
        'scheduledTrip.vehicle',
        'scheduledTrip.driver',
        'pickupStop',
        'dropOffStop',
      ],
    });
    if (!booking)
      throw new NotFoundException(`Booking with ID ${bookingId} not found.`);
    return booking;
  }

  async updateForAdmin(
    bookingId: string,
    updateBookingDto: UpdateBookingDto,
  ): Promise<Booking> {
    const booking = await this.findOneForAdmin(bookingId);
    const originalStatus = booking.status;
    booking.status = updateBookingDto.status;
    if (updateBookingDto.status === BookingStatus.CANCELLED_BY_ADMIN) {
      booking.cancellationReason = 'Cancelled by administrator.';
      if (
        originalStatus === BookingStatus.CONFIRMED ||
        originalStatus === BookingStatus.ONGOING
      ) {
        await this.tripsService.increaseAvailableSeats(
          booking.scheduledTripId,
          booking.numberOfSeatsBooked,
          this.entityManager,
        );
      }
    }
    return this.bookingRepository.save(booking);
  }

  async removeForAdmin(bookingId: string): Promise<void> {
    const booking = await this.findOneForAdmin(bookingId);
    if (
      booking.status === BookingStatus.CONFIRMED ||
      booking.status === BookingStatus.ONGOING
    ) {
      await this.tripsService.increaseAvailableSeats(
        booking.scheduledTripId,
        booking.numberOfSeatsBooked,
        this.entityManager,
      );
    }
    const result = await this.bookingRepository.delete(bookingId);
    if (result.affected === 0)
      throw new NotFoundException(
        `Booking with ID ${bookingId} not found for deletion.`,
      );
  }

  async createInsecureBookingForTest(
    userId: string,
    dto: CreateBookingDto,
  ): Promise<Booking> {
    if (dto.tripType === BookingTripType.ROUNDTRIP) {
      throw new BadRequestException(
        'This test endpoint does not support round trips. Use the main createBooking endpoint.',
      );
    }
    return this.entityManager.transaction(
      async (transactionalEntityManager) => {
        const user = await transactionalEntityManager
          .getRepository(User)
          .findOneBy({ id: userId });
        if (!user) throw new NotFoundException('User not found.');
        const booking = await this.createSingleLegBooking(
          userId,
          user,
          {
            scheduledTripId: dto.onwardScheduledTripId,
            pickupStopId: dto.onwardPickupStopId,
            dropOffStopId: dto.onwardDropOffStopId,
            selectedSeatIds: dto.onwardSelectedSeatIds,
          },
          dto,
          transactionalEntityManager,
        );
        return booking;
      },
    );
  }

  private generateCrn(): string {
    return `CRN${Date.now().toString().slice(-6)}${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;
  }

  public canUserCancelBooking(booking: Booking): boolean {
    if (!booking || booking.status !== BookingStatus.CONFIRMED) return false;
    if (!booking.tripDepartureDateTime) return false;
    const departure = new Date(booking.tripDepartureDateTime);
    return differenceInHours(departure, new Date()) >= 2;
  }

  async findUserBookings(
    userId: string,
    type: 'upcoming' | 'completed' | 'cancelled' | 'all' = 'all',
  ): Promise<Booking[]> {
    const qb = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.scheduledTrip', 'trip')
      .leftJoinAndSelect('trip.route', 'route')
      .leftJoinAndSelect('route.stops', 'routeStops') // THIS IS THE MODIFIED LINE
      .leftJoinAndSelect('trip.vehicle', 'vehicle')
      .leftJoinAndSelect('vehicle.vehicleType', 'vehicleType')
      .leftJoinAndSelect('booking.pickupStop', 'pickupStop')
      .leftJoinAndSelect('booking.dropOffStop', 'dropOffStop')
      .where('booking.userId = :userId', { userId });
    const now = new Date();
    switch (type) {
      case 'upcoming':
        qb.andWhere('booking.tripDepartureDateTime >= :now', { now }).andWhere(
          'booking.status IN (:...statuses)',
          {
            statuses: [BookingStatus.CONFIRMED, BookingStatus.ONGOING],
          },
        );
        break;
      case 'completed':
        qb.andWhere('booking.status = :status', {
          status: BookingStatus.COMPLETED,
        });
        break;
      case 'cancelled':
        qb.andWhere('booking.status IN (:...statuses)', {
          statuses: [
            BookingStatus.CANCELLED_BY_USER,
            BookingStatus.CANCELLED_BY_ADMIN,
          ],
        });
        break;
    }
    qb.orderBy(
      'booking.tripDepartureDateTime',
      type === 'upcoming' ? 'ASC' : 'DESC',
    );
    return qb.getMany();
  }

  async getDriverLocationForBooking(
    userId: string,
    bookingId: string,
  ): Promise<{ latitude: number; longitude: number }> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, userId },
      relations: ['scheduledTrip', 'scheduledTrip.driver'],
    });

    if (!booking) {
      throw new NotFoundException(
        'Booking not found or you do not have permission to view it.',
      );
    }

    if (booking.scheduledTrip?.status !== TripStatus.ACTIVE) {
      throw new ForbiddenException(
        'You can only track the driver after the trip has started.',
      );
    }

    const driver = booking.scheduledTrip?.driver;
    if (
      !driver ||
      driver.currentLatitude == null ||
      driver.currentLongitude == null
    ) {
      throw new NotFoundException("Driver's location is not available yet.");
    }
    return {
      latitude: driver.currentLatitude,
      longitude: driver.currentLongitude,
    };
  }

  async findOneForUserWithDetail(
    userId: string,
    bookingId: string,
    manager?: EntityManager,
  ): Promise<Booking> {
    const repository = manager
      ? manager.getRepository(Booking)
      : this.bookingRepository;
    const booking = await repository.findOne({
      where: { id: bookingId, userId },
      relations: [
        'user',
        'scheduledTrip',
        'scheduledTrip.route',
        'scheduledTrip.vehicle',
        'scheduledTrip.vehicle.vehicleType',
        'scheduledTrip.driver',
        'pickupStop',
        'dropOffStop',
      ],
    });
    if (!booking)
      throw new NotFoundException(
        `Booking with ID ${bookingId} not found or does not belong to user.`,
      );
    return booking;
  }

  async cancelBookingByUser(
    userId: string,
    bookingId: string,
    cancelDto: CancelBookingDto,
  ): Promise<Booking> {
    return this.entityManager.transaction(
      async (transactionalEntityManager) => {
        const bookingRepo = transactionalEntityManager.getRepository(Booking);
        const booking = await bookingRepo.findOne({
          where: { id: bookingId, userId },
          relations: ['scheduledTrip'],
        });

        if (!booking) {
          throw new NotFoundException('Booking not found.');
        }

        if (!booking.tripDepartureDateTime) {
          throw new InternalServerErrorException(
            'Booking is missing departure time, cannot process cancellation.',
          );
        }

        if (!this.canUserCancelBooking(booking)) {
          throw new BadRequestException(
            'Booking cannot be cancelled at this time (outside cancellation window).',
          );
        }

        booking.status = BookingStatus.CANCELLED_BY_USER;

        let reason = 'Cancelled by user.';

        if (cancelDto.predefinedReason) {
          reason = this.mapReasonCodeToText(cancelDto.predefinedReason);
        } else if (cancelDto.otherReason && cancelDto.otherReason.trim() !== '') {
          reason = cancelDto.otherReason;
        }

        booking.cancellationReason = reason;

        const savedBooking = await bookingRepo.save(booking);

        await this.tripsService.increaseAvailableSeats(
          booking.scheduledTripId,
          booking.numberOfSeatsBooked,
          transactionalEntityManager,
        );

        return this.findOneForUserWithDetail(
          userId,
          savedBooking.id,
          transactionalEntityManager,
        );
      },
    );
  }

  private mapReasonCodeToText(reasonCode: CancellationReasonCode): string {
    switch (reasonCode) {
      case CancellationReasonCode.WAITING_TOO_LONG:
        return 'Waiting for long time';
      case CancellationReasonCode.UNABLE_TO_CONTACT_DRIVER:
        return 'Unable to contact driver';
      default:
        return 'User cancelled with a predefined reason.';
    }
  }

  async addFeedbackToBooking(
    userId: string,
    bookingId: string,
    feedbackDto: CreateFeedbackDto,
  ): Promise<Booking> {
    return this.entityManager.transaction(
      async (transactionalEntityManager) => {
        const bookingRepo = transactionalEntityManager.getRepository(Booking);
        const booking = await bookingRepo.findOne({
          where: { id: bookingId, userId },
          relations: ['user', 'scheduledTrip'],
        });
        if (!booking) throw new NotFoundException('Booking not found.');
        if (booking.status !== BookingStatus.COMPLETED)
          throw new BadRequestException(
            'Feedback can only be submitted for completed rides.',
          );
        if (booking.rating)
          throw new ConflictException(
            'Feedback already submitted for this booking.',
          );
        booking.rating = feedbackDto.rating;
        booking.feedbackComment = feedbackDto.comment;
        booking.tipAmount = feedbackDto.tipAmount;
        await bookingRepo.save(booking);
        return this.findOneForUserWithDetail(
          userId,
          booking.id,
          transactionalEntityManager,
        );
      },
    );
  }

  async generateReceiptData(
    userId: string,
    bookingId: string,
  ): Promise<{ message: string; receipt: MyRideDetailDto }> {
    const booking = await this.findOneForUserWithDetail(userId, bookingId);
    const canCancel = this.canUserCancelBooking(booking);
    return {
      message: 'Receipt data retrieved.',
      receipt: new MyRideDetailDto(booking, canCancel),
    };
  }

  async findPassengersForDriverTrip(
    driverId: string,
    tripId: string,
  ): Promise<PassengerForTripDto[]> {
    const bookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.pickupStop', 'pickupStop')
      .innerJoin('booking.scheduledTrip', 'trip')
      .addSelect('booking.boardingOtp')
      .where('booking.scheduledTripId = :tripId', { tripId })
      .andWhere('trip.driverId = :driverId', { driverId })
      .andWhere('booking.status = :status', { status: BookingStatus.CONFIRMED })
      .orderBy('pickupStop.sequence', 'ASC')
      .getMany();
    return bookings.map((booking) => new PassengerForTripDto(booking));
  }

  async onboardPassenger(
    driverId: string,
    bookingId: string,
  ): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['scheduledTrip', 'user'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found.`);
    }
    if (booking.scheduledTrip?.driverId !== driverId) {
      throw new ForbiddenException(
        'You are not authorized to modify this booking.',
      );
    }
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        `This booking cannot be unlocked. Its current status is "${booking.status}".`,
      );
    }

    booking.status = BookingStatus.ONGOING;
    const savedBooking = await this.bookingRepository.save(booking);

    return savedBooking;
  }
  
  async declineBookingByDriver(
    driverId: string,
    bookingId: string,
    declineBookingDto: DeclineBookingDto,
  ): Promise<Booking> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const bookingRepo = transactionalEntityManager.getRepository(Booking);
      const booking = await bookingRepo.findOne({
        where: { id: bookingId },
        relations: ['scheduledTrip', 'user'],
      });

      if (!booking) {
        throw new NotFoundException(`Booking with ID ${bookingId} not found.`);
      }
      if (booking.scheduledTrip?.driverId !== driverId) {
        throw new ForbiddenException(
          'You are not authorized to modify this booking.',
        );
      }
      if (booking.status !== BookingStatus.CONFIRMED) {
        throw new BadRequestException(
          `Only a confirmed booking can be declined. Current status: "${booking.status}".`,
        );
      }
      
      booking.status = BookingStatus.DECLINED_BY_DRIVER;
      
      booking.driverDeclineReason = declineBookingDto.reason; 
      
      const savedBooking = await bookingRepo.save(booking);
      
      await this.tripsService.increaseAvailableSeats(
        booking.scheduledTripId,
        booking.numberOfSeatsBooked,
        transactionalEntityManager,
      );
      
      return savedBooking;
    });
  }
}