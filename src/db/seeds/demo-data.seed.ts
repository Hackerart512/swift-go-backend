// src/db/seeds/demo-data.seed.ts

// This script is designed to be run manually from the command line, e.g., `npm run seed:demo`.
// It will clear existing demo data and populate your database with a consistent set of
// routes, stops (with coordinates), vehicles, drivers, and scheduled trips for testing.

import { DataSource, Point } from 'typeorm';
import { Route } from '../../modules/routes/entities/route.entity';
import { RouteStop, StopType } from '../../modules/routes/entities/route-stop.entity';
import { VehicleType, SimpleCarSeat } from '../../modules/vehicles/entities/vehicle-type.entity';
import { Vehicle, VehicleStatus } from '../../modules/vehicles/entities/vehicle.entity';
import { User, UserGender, KycStatus, PhoneVerificationStatus } from '../../modules/users/users.entity';
import { ScheduledTrip, TripStatus } from '../../modules/trips/entities/scheduled-trip.entity';
import { FavoriteLocation } from '../../modules/users/entities/favorite-location.entity';
import { UserSubscription } from '../../modules/user-subscriptions/entities/user-subscription.entity';
import { SubscriptionPlan } from '../../modules/subscription-plans/entities/subscription-plan.entity';
import { HelpCategory } from '../../modules/help/entities/help-category.entity';
import { FaqItem } from '../../modules/help/entities/faq-item.entity';
import { RouteSuggestion } from '../../modules/suggestions/entities/route-suggestion.entity';
import { Promotion } from '../../modules/promotions/entities/promotion.entity';
import { Booking } from '../../modules/bookings/entities/booking.entity';
import { addHours, set, startOfToday } from 'date-fns';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { join } from 'path'; // To resolve .env path
import { Driver, DriverStatus, KycStatus as DriverKycStatus } from '../../modules/drivers/entities/driver.entity';

console.log('🌱 Starting database seeder...');

// Load environment variables from .env file at the project root
dotenv.config({ path: join(__dirname, '../../../.env') });

// Helper function to create dates in the future for scheduling trips
const getFutureDate = (daysToAdd: number, hour: number, minute: number): Date => {
  let date = startOfToday(); // Start with today at 00:00:00
  if (daysToAdd > 0) {
    date = new Date(date.setDate(date.getDate() + daysToAdd));
  }
  return set(date, { hours: hour, minutes: minute, seconds: 0, milliseconds: 0 });
};

// Helper function to create Point from latitude, longitude (user-friendly order)
function toPoint(lat: number, lng: number): Point {
  return { type: 'Point', coordinates: [lng, lat] };
}

async function runSeed() {
  // --- Database Connection Setup ---
  // Manually configure the DataSource for this script, using variables from .env
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    
    // --- ADD THIS SSL CONFIGURATION ---
    ssl: process.env.DB_SSL === 'true' 
        ? { rejectUnauthorized: false } // For dev, allows connection without verifying CA cert
        : undefined, // Or just false if your env var isn't set
    // --- END OF SSL CONFIGURATION ---

    // List all entities that this seeder will interact with
    entities: [
      Route, 
      RouteStop, 
      VehicleType, 
      Vehicle, 
      User, 
      Driver,
      ScheduledTrip, 
      FavoriteLocation, 
      Booking,
      UserSubscription,
      SubscriptionPlan,
      HelpCategory,
      FaqItem,
      RouteSuggestion,
      Promotion,
    ],
    synchronize: true, // Seeder should NEVER synchronize schema in production, ok for temp dev setup
  });

  try {
    await dataSource.initialize();
    console.log('✔️ Database connection initialized successfully.');

    // Use a single transaction to ensure all or nothing is seeded
    await dataSource.transaction(async (manager) => {
      console.log('--- Seeding started within transaction ---');

      // --- Clean up old demo data (order is important due to foreign keys) ---
      // Delete from tables that are referenced by others first
      console.log('🧹 Clearing old demo data...');
      await manager.query('DELETE FROM "bookings";');
      await manager.query('DELETE FROM "user_subscriptions";');
      await manager.query('DELETE FROM "subscription_plans";');
      await manager.query('DELETE FROM "scheduled_trips";');
      await manager.query('DELETE FROM "vehicles";');
      await manager.query('DELETE FROM "vehicle_types";');
      await manager.query('DELETE FROM "route_stops";');
      await manager.query('DELETE FROM "routes";');
      // Only delete the specific test drivers, not all users
      await manager.query('DELETE FROM "users" WHERE "email" LIKE \'%@driver.texride.com\';');
      console.log('✔️ Cleared old demo data.');

      // --- 1. Seed Vehicle Types ---
      const sedanSeatIdentifiers: SimpleCarSeat[] = [
          { seatId: 'FP', description: 'Front Passenger', isBookable: true },
          { seatId: 'RL', description: 'Rear Left', isBookable: true },
          { seatId: 'RR', description: 'Rear Right', isBookable: true },
      ];
      const suvSeatIdentifiers: SimpleCarSeat[] = [
          { seatId: 'FP', description: 'Front Passenger', isBookable: true },
          { seatId: 'RL', description: 'Rear Left', isBookable: true },
          { seatId: 'RM', description: 'Rear Middle', isBookable: true },
          { seatId: 'RR', description: 'Rear Right', isBookable: true },
      ];

      const sedanType = await manager.save(VehicleType, { name: 'Standard Sedan', passengerCapacity: 3, simpleSeatIdentifiers: sedanSeatIdentifiers, transmissionType: 'Automatic', category: 'Sedan' });
      const suvType = await manager.save(VehicleType, { name: 'Compact SUV', passengerCapacity: 4, simpleSeatIdentifiers: suvSeatIdentifiers, transmissionType: 'Manual', category: 'SUV' });
      console.log('✔️ Seeded Vehicle Types.');

      // --- 2. Seed Vehicles ---
      const vehicle1 = await manager.save(Vehicle, { registrationNumber: 'TS01CAR001', modelName: 'Maruti Dzire', vehicleType: sedanType, status: VehicleStatus.ACTIVE });
      const vehicle2 = await manager.save(Vehicle, { registrationNumber: 'AP02CAR002', modelName: 'Hyundai Creta', vehicleType: suvType, status: VehicleStatus.ACTIVE });
      const vehicle3 = await manager.save(Vehicle, { registrationNumber: 'KA03CAR003', modelName: 'Honda City', vehicleType: sedanType, status: VehicleStatus.ACTIVE });
      console.log('✔️ Seeded Vehicles.');

      // --- 3. Seed Drivers (as Users) ---
      const driverPassword = await bcrypt.hash('DriverPass123!', 10);
      const driverUser1 = await manager.save(User, {
          fullName: 'Ramesh Kumar', email: 'ramesh@driver.texride.com', password: driverPassword,
          gender: UserGender.MALE, kycStatus: KycStatus.VERIFIED, phoneVerificationStatus: PhoneVerificationStatus.VERIFIED, mobileNumber: '+919999900001', walletBalance: 0
      });
      const driverUser2 = await manager.save(User, {
          fullName: 'Sita Sharma', email: 'sita@driver.texride.com', password: driverPassword,
          gender: UserGender.FEMALE, kycStatus: KycStatus.VERIFIED, phoneVerificationStatus: PhoneVerificationStatus.VERIFIED, mobileNumber: '+919999900002', walletBalance: 0
      });

      // --- 3b. Seed Drivers (in drivers table) ---
      const driver1 = await manager.save(Driver, {
          id: driverUser1.id, // Use the same ID as the user for consistency (if your system expects this)
          fullName: driverUser1.fullName,
          email: driverUser1.email,
          mobileNumber: driverUser1.mobileNumber,
          status: DriverStatus.ACTIVE,
          kycStatus: DriverKycStatus.VERIFIED,
          isActive: true,
          isMobileVerified: true,
      });
      const driver2 = await manager.save(Driver, {
          id: driverUser2.id,
          fullName: driverUser2.fullName,
          email: driverUser2.email,
          mobileNumber: driverUser2.mobileNumber,
          status: DriverStatus.ACTIVE,
          kycStatus: DriverKycStatus.VERIFIED,
          isActive: true,
          isMobileVerified: true,
      });
      console.log('✔️ Seeded Drivers.');

      // --- 4. Seed Routes & Stops with Coordinates ---
      const lancoHillsCoords: Point = toPoint(17.4169, 78.3720);   // (lat, lng)
      const myHomeBhoojaCoords: Point = toPoint(17.4325, 78.3785); // (lat, lng)
      const wiproCircleCoords: Point = toPoint(17.4428, 78.3490);  // (lat, lng)
      const kphbMetroCoords: Point = toPoint(17.4948, 78.3919);    // (lat, lng)

      const route1 = await manager.save(Route, { name: 'Manikonda -> Hitech City', originAreaName: 'Manikonda', destinationAreaName: 'Hitech City' });
      await manager.save(RouteStop, { route: route1, name: 'Lanco Hills Main Gate', type: StopType.PICKUP, sequence: 1, location: lancoHillsCoords });
      await manager.save(RouteStop, { route: route1, name: 'My Home Bhooja Entrance', type: StopType.DROPOFF, sequence: 2, location: myHomeBhoojaCoords });

      const route2 = await manager.save(Route, { name: 'KPHB -> Gachibowli', originAreaName: 'KPHB', destinationAreaName: 'Gachibowli' });
      await manager.save(RouteStop, { route: route2, name: 'KPHB Metro Station', type: StopType.PICKUP, sequence: 1, location: kphbMetroCoords });
      await manager.save(RouteStop, { route: route2, name: 'Wipro Circle, Gachibowli', type: StopType.DROPOFF, sequence: 2, location: wiproCircleCoords });

      // --- Additional Routes & Stops ---
      const madhapurMetroCoords: Point = toPoint(17.4474, 78.3910);
      const inorbitMallCoords: Point = toPoint(17.4336, 78.3827);
      const gachibowliStadiumCoords: Point = toPoint(17.4401, 78.3556);
      const miyapurMetroCoords: Point = toPoint(17.5002, 78.3639);

      const route3 = await manager.save(Route, { name: 'Madhapur -> Inorbit Mall', originAreaName: 'Madhapur', destinationAreaName: 'Inorbit Mall' });
      await manager.save(RouteStop, { route: route3, name: 'Madhapur Metro Station', type: StopType.PICKUP, sequence: 1, location: madhapurMetroCoords });
      await manager.save(RouteStop, { route: route3, name: 'Inorbit Mall Entrance', type: StopType.DROPOFF, sequence: 2, location: inorbitMallCoords });

      const route4 = await manager.save(Route, { name: 'Miyapur -> Gachibowli Stadium', originAreaName: 'Miyapur', destinationAreaName: 'Gachibowli Stadium' });
      await manager.save(RouteStop, { route: route4, name: 'Miyapur Metro Station', type: StopType.PICKUP, sequence: 1, location: miyapurMetroCoords });
      await manager.save(RouteStop, { route: route4, name: 'Gachibowli Stadium', type: StopType.DROPOFF, sequence: 2, location: gachibowliStadiumCoords });

      console.log('✔️ Seeded Routes and Stops with Coordinates.');

      // --- 5. Seed Scheduled Trips ---
      const tripsToCreate = [
        // Today's Trips - schedule for later today
        { route: route1, vehicle: vehicle1, driver: driver1, departureDateTime: addHours(new Date(), 2), estimatedArrivalDateTime: addHours(new Date(), 2.75), pricePerSeat: 120 },
        { route: route1, vehicle: vehicle3, driver: driver2, departureDateTime: addHours(new Date(), 3), estimatedArrivalDateTime: addHours(new Date(), 3.75), pricePerSeat: 120 },
        { route: route2, vehicle: vehicle2, driver: driver1, departureDateTime: addHours(new Date(), 4), estimatedArrivalDateTime: addHours(new Date(), 4.75), pricePerSeat: 125 },
        // Tomorrow's Trips
        { route: route1, vehicle: vehicle1, driver: driver1, departureDateTime: getFutureDate(1, 8, 30), estimatedArrivalDateTime: getFutureDate(1, 9, 15), pricePerSeat: 120 },
      ];
      
      // =========================== FIX START ===========================
      // The issue was trying to save the `driver` object directly.
      // The correct approach is to remove the `driver` object from the payload
      // and provide only the `driverId` for the relationship.

      for (const tripData of tripsToCreate) {
        // Destructure the tripData to separate the 'driver' object from the rest.
        const { driver, ...restOfTripData } = tripData;
        const initialSeats = tripData.vehicle.vehicleType.passengerCapacity;

        await manager.save(ScheduledTrip, {
          ...restOfTripData,          // Spread the rest (route, vehicle, dates, etc.)
          driverId: driver.id,        // Set the foreign key using the driver's ID
          initialAvailableSeats: initialSeats,
          currentAvailableSeats: initialSeats,
          status: TripStatus.SCHEDULED,
        });
      }
      // ============================ FIX END ============================

      console.log(`✔️ Seeded ${tripsToCreate.length} Scheduled Trips.`);

    }); // End of transaction

    console.log('--- Seeding completed successfully ---');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('✔️ Database connection closed.');
    }
  }
}

// Execute the seeder function
runSeed();