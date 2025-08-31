// src/modules/drivers/drivers.service.ts

import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, Between, In } from 'typeorm';
import {
  startOfDay,
  endOfDay,
  subMonths,
  startOfWeek,
  endOfWeek,
  format,
  subDays,
  isToday,
  isYesterday,
} from 'date-fns';
import { Driver, DriverStatus, KycStatus } from './entities/driver.entity';
import { DriverRegistrationDto } from './dto/driver-registration.dto';
import { DriverWallet } from './entities/driver-wallet.entity';
import { DriverEarning, EarningType } from './entities/driver-earning.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { UpdateDriverLocationDto } from './dto/update-driver-location.dto';
// REMOVE TrackingGateway import
// import { TrackingGateway } from '../tracking/tracking.gateway';
import { ScheduledTrip, TripStatus } from '../trips/entities/scheduled-trip.entity';
import { UpdateDriverStatusDto } from './dto/update-driver-status.dto';
import {
  DailyEarningItemDto,
  EarningsResponseDto,
  WeeklyEarningDto,
} from './dto';

@Injectable()
export class DriversService {
  private readonly logger = new Logger(DriversService.name);

  constructor(
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(DriverWallet)
    private readonly walletRepository: Repository<DriverWallet>,
    @InjectRepository(DriverEarning)
    private readonly earningRepository: Repository<DriverEarning>,
    @InjectRepository(ScheduledTrip)
    private readonly tripRepository: Repository<ScheduledTrip>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    // REMOVE the TrackingGateway from the constructor
    // private readonly trackingGateway: TrackingGateway,
  ) {}

  // ========================================================================= //
  // ===================== THE ONLY METHOD WE ARE CHANGING =================== //
  // ========================================================================= //

  /**
   * Updates a driver's location in the database.
   * This method is now simple and only handles the database interaction.
   * The TrackingGateway is responsible for broadcasting the location update.
   *
   * @param driverId The ID of the driver to update.
   * @param locationDto The new location data.
   * @returns The updated Driver entity.
   */
  async updateDriverLocation(
    driverId: string,
    locationDto: UpdateDriverLocationDto,
  ): Promise<Driver> {
    this.logger.log(`Updating location in DB for driver ${driverId}`);
    
    // Using `update` is more efficient than `findOne` then `save` if you don't need the entity back immediately.
    const result = await this.driverRepository.update(
      { id: driverId },
      {
        currentLatitude: locationDto.latitude,
        currentLongitude: locationDto.longitude,
      },
    );

    if (result.affected === 0) {
      this.logger.warn(`Driver with ID ${driverId} not found for location update.`);
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    // You can choose to return void or fetch the updated driver if needed elsewhere.
    // For the gateway's purpose, returning nothing (void) is fine.
    // We'll return the updated entity for consistency.
    const updatedDriver = await this.findById(driverId);
    if (!updatedDriver) {
        // This case is unlikely if the update succeeded but is good practice to handle
        throw new InternalServerErrorException('Failed to retrieve driver after location update.');
    }

    this.logger.log(`Successfully updated location in DB for driver ${driverId}`);
    return updatedDriver;
  }

  // ========================================================================= //
  // ============ NO OTHER CHANGES ARE NEEDED IN THE FILE BELOW ============ //
  // ========================================================================= //

  async getEarningsData(driverId: string): Promise<EarningsResponseDto> {
    const now = new Date();
    const lastMonthStart = startOfDay(subMonths(now, 1));
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastMonthEarnings = await this.earningRepository.find({
      where: {
        driverId,
        type: EarningType.RIDE_FARE,
        transactionDate: Between(lastMonthStart, now),
      },
      order: { transactionDate: 'DESC' },
    });
    const lastMonthTotal = lastMonthEarnings.reduce(
      (sum, earn) => sum + Number(earn.amount),
      0,
    );
    const lastMonthRides = lastMonthEarnings.length;
    const lastMonthHours = '25D 12H';
    const wallet = await this.walletRepository.findOneBy({ driverId });
    const totalBalance = Number(wallet?.withdrawableBalance || 0);
    const weeklyEarningsMap = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      const day = format(subDays(weekEnd, i), 'E');
      weeklyEarningsMap.set(day, 0);
    }
    const currentWeekEarnings = await this.earningRepository.find({
      where: {
        driverId,
        type: EarningType.RIDE_FARE,
        transactionDate: Between(weekStart, weekEnd),
      },
    });
    currentWeekEarnings.forEach((earning) => {
      const day = format(earning.transactionDate, 'E');
      const current = weeklyEarningsMap.get(day) || 0;
      weeklyEarningsMap.set(day, current + Number(earning.amount));
    });
    const weeklyEarnings: WeeklyEarningDto[] = [
      'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su',
    ].map((day) => ({
      day: day,
      amount: weeklyEarningsMap.get(day.slice(0, 2)) || 0,
    }));
    const dailyEarningsMap = new Map<string, number>();
    lastMonthEarnings.slice(0, 30).forEach((earning) => {
      const dayStr = format(earning.transactionDate, 'yyyy-MM-dd');
      const total = dailyEarningsMap.get(dayStr) || 0;
      dailyEarningsMap.set(dayStr, total + Number(earning.amount));
    });
    const dailyEarnings: DailyEarningItemDto[] = [];
    dailyEarningsMap.forEach((amount, dateStr) => {
      const date = new Date(dateStr);
      let label = format(date, 'dd/MM/yyyy');
      if (isToday(date)) label = 'Today';
      if (isYesterday(date)) label = 'Yesterday';
      dailyEarnings.push(new DailyEarningItemDto(date, label, amount));
    });
    return new EarningsResponseDto({
      lastMonthTotal,
      lastMonthRides,
      lastMonthHours,
      totalBalance,
      weeklyEarnings,
      dailyEarnings,
    });
  }

  async findAll(): Promise<Driver[]> {
    return this.driverRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async updateDriverStatus(
    id: string,
    dto: UpdateDriverStatusDto,
  ): Promise<Driver> {
    const driver = await this.findById(id);
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${id} not found.`);
    }

    if (driver.status !== DriverStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        `Can only approve or reject a PENDING driver. Current status: ${driver.status}`,
      );
    }

    driver.status = dto.status;

    if (dto.status === DriverStatus.REJECTED) {
      if (!dto.rejectionReason) {
        throw new BadRequestException(
          'A rejection reason is required when rejecting a driver.',
        );
      }
      driver.rejectionReason = dto.rejectionReason;
    }

    return this.driverRepository.save(driver);
  }

  async registerNewDriver(
    dto: Partial<DriverRegistrationDto> & {
      mobileNumber: string;
      isMobileVerified: boolean;
    },
  ): Promise<Driver> {
    const existingByPhone = await this.driverRepository.findOneBy({
      mobileNumber: dto.mobileNumber,
    });
    if (existingByPhone)
      throw new ConflictException(
        'A driver with this phone number already exists.',
      );

    const driver = this.driverRepository.create({
      mobileNumber: dto.mobileNumber,
      status: DriverStatus.PENDING_APPROVAL,
      kycStatus: KycStatus.PENDING,
    });
    return this.driverRepository.save(driver);
  }

  async findById(id: string): Promise<Driver | null> {
    return this.driverRepository.findOneBy({ id });
  }

  async findByAadhaar(aadhaarNumber: string): Promise<Driver | null> {
    return this.driverRepository.findOneBy({ aadhaarNumber });
  }

  async findByMobileNumber(
    mobileNumber: string,
    withAuthDetails = false,
  ): Promise<Driver | null> {
    if (withAuthDetails) {
      return this.driverRepository.findOne({
        where: { mobileNumber },
        select: [
          'id',
          'mobileNumber',
          'password',
          'phoneOtp',
          'phoneOtpExpiresAt',
          'isMobileVerified',
          'status',
        ],
      });
    }
    return this.driverRepository.findOneBy({ mobileNumber });
  }

  async createPartialDriver(data: Partial<Driver>): Promise<Driver> {
    const driver = this.driverRepository.create(data);
    return this.driverRepository.save(driver);
  }

  async updatePartialDriver(
    id: string,
    data: Partial<Driver>,
  ): Promise<Driver> {
    await this.driverRepository.update(id, data);
    const driver = await this.findById(id);
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${id} not found.`);
    }
    return driver;
  }

  async updateDocumentUrl(
    driverId: string,
    docType:
      | 'profilePhotoUrl'
      | 'driversLicenseUrl'
      | 'vehicleRcUrl'
      | 'vehicleInsuranceUrl',
    url: string,
  ): Promise<Driver> {
    const driver = await this.findById(driverId);
    if (!driver) throw new NotFoundException('Driver not found');
    driver[docType] = url;
    return this.driverRepository.save(driver);
  }

  async updateKycStatus(
    driverId: string,
    kycStatus: KycStatus,
    aadhaarNumber: string,
    kycDetails: any,
  ): Promise<Driver> {
    const driver = await this.findById(driverId);
    if (!driver) throw new NotFoundException('Driver not found');
    driver.kycStatus = kycStatus;
    driver.aadhaarNumber = aadhaarNumber;
    driver.kycDetails = kycDetails;
    return this.driverRepository.save(driver);
  }

  async updateProfile(
    driverId: string,
    updateDto: Partial<{ fullName?: string; email?: string }>,
  ): Promise<Driver> {
    const driver = await this.findById(driverId);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    if (updateDto.fullName !== undefined) {
      driver.fullName = updateDto.fullName;
    }
    if (updateDto.email !== undefined) {
      driver.email = updateDto.email;
    }

    try {
      return await this.driverRepository.save(driver);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException(
          'This email address is already in use by another account.',
        );
      }
      throw new InternalServerErrorException(
        'An error occurred while updating the profile.',
      );
    }
  }

  async recordRideEarning(
    driverId: string,
    booking: Booking,
    manager: EntityManager,
  ): Promise<void> {
    const driverEarningRepo = manager.getRepository(DriverEarning);
    const driverWalletRepo = manager.getRepository(DriverWallet);
    const earningAmount = Number(booking.baseFare) * 0.8;
    await driverEarningRepo.save({
      driverId,
      bookingId: booking.id,
      type: EarningType.RIDE_FARE,
      amount: earningAmount,
      description: `Earning from booking ${booking.crn}`,
    });
    await driverWalletRepo.increment(
      { driverId },
      'withdrawableBalance',
      earningAmount,
    );
  }

  async getDashboardData(driverId: string) {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const todaysEarningsResult = await this.earningRepository
      .createQueryBuilder('earning')
      .select('SUM(earning.amount)', 'total')
      .where('earning.driverId = :driverId', { driverId })
      .andWhere('earning.type IN (:...earningTypes)', {
        earningTypes: [
          EarningType.RIDE_FARE,
          EarningType.TIP,
          EarningType.BONUS,
        ],
      })
      .andWhere('earning.transactionDate BETWEEN :start AND :end', {
        start: todayStart,
        end: todayEnd,
      })
      .getRawOne();
    const todaysEarnings = Number(todaysEarningsResult?.total || 0);
    const wallet = await this.walletRepository.findOneBy({ driverId });
    const totalBalance = Number(wallet?.withdrawableBalance || 0);
    return { todaysEarnings, totalBalance };
  }
}