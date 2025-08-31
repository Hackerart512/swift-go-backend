// src/modules/trips/entities/scheduled-trip.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Route } from '../../routes/entities/route.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Booking } from '../../bookings/entities/booking.entity'; // Forward-declare for relation
import { Driver } from '../../drivers/entities/driver.entity';

export enum TripStatus {
  SCHEDULED = 'scheduled', // Planned, open for booking
  ACTIVE = 'active', // Trip is currently ongoing (driver started)
  COMPLETED = 'completed', // Trip finished
  CANCELLED = 'cancelled', // Trip was cancelled by admin or system
  FULL = 'full', // All seats booked
  DELAYED = 'delayed',
}

@Entity('scheduled_trips')
@Index(['routeId', 'departureDateTime'])
@Index(['vehicleId', 'departureDateTime', 'status'], {
  where: "status IN ('scheduled', 'active', 'delayed')",
}) // For vehicle conflict check
export class ScheduledTrip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // --- NEW FIELD ADDED HERE ---
  @Index() // We add an index because we will be looking up trips by this ID
  @Column({ type: 'uuid', nullable: true })
  seriesId: string | null; // This will link recurring trips together. Null for single trips.

  @Column()
  routeId: string;
  @ManyToOne(() => Route, (route) => route.scheduledTrips, {
    nullable: false,
    eager: true,
  })
  @JoinColumn({ name: 'routeId' })
  route: Route;

  @Column()
  vehicleId: string;
  @ManyToOne(
    () => Vehicle,
    /* vehicle => vehicle.scheduledTrips (add this relation to Vehicle entity) */ {
      nullable: false,
      eager: true,
    },
  )
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  @Column({ nullable: true })
  driverId: string;
  @ManyToOne(() => Driver, { nullable: true, eager: true })
  @JoinColumn({ name: 'driverId' })
  driver: Driver;

  @Column({ type: 'timestamptz' })
  departureDateTime: Date;

  @Column({ type: 'timestamptz' })
  estimatedArrivalDateTime: Date;

  @Column({ type: 'enum', enum: TripStatus, default: TripStatus.SCHEDULED })
  status: TripStatus;

  @Column({ type: 'int' })
  initialAvailableSeats: number; // Set from vehicle.effectivePassengerCapacity at creation

  @Column({ type: 'int' })
  currentAvailableSeats: number; // Decremented/incremented by bookings

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  pricePerSeat: number;

  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency: string;

  @Column({ default: true })
  isActive: boolean; // Admin can soft-delete/deactivate a trip

  @Column({ type: 'text', nullable: true })
  adminNotes?: string; // Internal notes for admins

  @Column({ type: 'text', nullable: true })
  driverInstructions?: string; // Specific instructions for the driver for this trip

  @OneToMany(() => Booking, (booking) => booking.scheduledTrip) // Relation to Bookings
  bookings: Booking[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}