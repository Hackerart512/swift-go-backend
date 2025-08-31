// src/modules/drivers/drivers.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { subDays, format } from 'date-fns';

import { DriversService } from './drivers.service';
import { Driver } from './entities/driver.entity';
import { DriverWallet } from './entities/driver-wallet.entity';
import { DriverEarning, EarningType } from './entities/driver-earning.entity';
import { ScheduledTrip } from '../trips/entities/scheduled-trip.entity';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { EarningsResponseDto } from './dto';
import { Booking } from '../bookings/entities/booking.entity'; // <-- ADDED IMPORT

// Mock data creation helper - CORRECTED
const createMockEarning = (amount: number, date: Date): DriverEarning => ({
  id: `earning-${Math.random()}`,
  driverId: 'test-driver-id',
  driver: new Driver(), // <-- THE FIX: Added required driver property
  amount,
  transactionDate: date,
  type: EarningType.RIDE_FARE,
  bookingId: `booking-${Math.random()}`,
  booking: new Booking(), // <-- Added optional booking property for completeness
  currency: 'INR',
  description: 'Mock earning',
});

describe('DriversService', () => {
  let service: DriversService;
  let driverRepository: Repository<Driver>;
  let walletRepository: Repository<DriverWallet>;
  let earningRepository: Repository<DriverEarning>;
  // We don't use tripRepo or trackingGateway in getEarningsData, but they are dependencies
  // let tripRepository: Repository<ScheduledTrip>;
  // let trackingGateway: TrackingGateway;

  const DRIVER_ID = 'test-driver-id';

  beforeEach(async () => {
    // Mock the tracking gateway
    const mockTrackingGateway = {
      broadcastDriverLocation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriversService,
        {
          provide: getRepositoryToken(Driver),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(DriverWallet),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(DriverEarning),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(ScheduledTrip),
          useClass: Repository,
        },
        {
          provide: TrackingGateway,
          useValue: mockTrackingGateway,
        },
      ],
    }).compile();

    service = module.get<DriversService>(DriversService);
    driverRepository = module.get<Repository<Driver>>(getRepositoryToken(Driver));
    walletRepository = module.get<Repository<DriverWallet>>(getRepositoryToken(DriverWallet));
    earningRepository = module.get<Repository<DriverEarning>>(getRepositoryToken(DriverEarning));
    // tripRepository = module.get<Repository<ScheduledTrip>>(getRepositoryToken(ScheduledTrip));
    // trackingGateway = module.get<TrackingGateway>(TrackingGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- TEST SUITE FOR getEarningsData ---
  describe('getEarningsData', () => {
    it('should calculate and return the full earnings data structure', async () => {
      // 1. Arrange: Setup mock data and repository responses
      const now = new Date();
      const mockEarnings: DriverEarning[] = [
        createMockEarning(100, now), // Today
        createMockEarning(50, now), // Today
        createMockEarning(200, subDays(now, 1)), // Yesterday
        createMockEarning(300, subDays(now, 2)),
        createMockEarning(400, subDays(now, 8)), // Last week
      ];

      const mockWallet: DriverWallet = {
        id: 'wallet-id',
        driverId: DRIVER_ID,
        withdrawableBalance: 1544.00,
        currency: 'INR',
        createdAt: now,
        updatedAt: now,
        driver: new Driver()
      };

      // Mock the repository 'find' and 'findOneBy' calls
      jest.spyOn(earningRepository, 'find').mockResolvedValue(mockEarnings);
      jest.spyOn(walletRepository, 'findOneBy').mockResolvedValue(mockWallet);

      // 2. Act: Call the method under test
      const result: EarningsResponseDto = await service.getEarningsData(DRIVER_ID);

      // 3. Assert: Check if the results are correct
      expect(result).toBeInstanceOf(EarningsResponseDto);
      
      // Check last month totals
      expect(result.lastMonthTotal).toBe(1050); // 100+50+200+300+400
      expect(result.lastMonthRides).toBe(5);
      
      // Check wallet balance
      expect(result.totalBalance).toBe(1544.00);

      // Check daily earnings list
      expect(result.dailyEarnings).toHaveLength(4); // 4 distinct days
      const todayEarning = result.dailyEarnings.find(e => e.label === 'Today');
      const yesterdayEarning = result.dailyEarnings.find(e => e.label === 'Yesterday');
      expect(todayEarning?.amount).toBe(150); // 100 + 50
      expect(yesterdayEarning?.amount).toBe(200);

      // Check weekly earnings chart
      // This is a simplified check. It ensures the structure is right and finds today's earning.
      const dayOfWeek = format(now, 'E').slice(0, 2); // 'Mo', 'Tu', etc.
      const weeklyEarningToday = result.weeklyEarnings.find(w => w.day.startsWith(dayOfWeek));

      expect(weeklyEarningToday).toBeDefined();

      // Verify repository methods were called
      expect(earningRepository.find).toHaveBeenCalled();
      expect(walletRepository.findOneBy).toHaveBeenCalledWith({ driverId: DRIVER_ID });
    });
  });
});