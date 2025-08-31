// src/modules/bookings/entities/booking.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/users.entity';
import { ScheduledTrip } from '../../trips/entities/scheduled-trip.entity';
import { RouteStop } from '../../routes/entities/route-stop.entity';

export enum BookingStatus {
  PENDING_PAYMENT = 'pending_payment',
  CONFIRMED = 'confirmed',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED_BY_USER = 'cancelled_by_user',
  CANCELLED_BY_ADMIN = 'cancelled_by_admin',
  NO_SHOW = 'no_show',
  DECLINED_BY_DRIVER = 'declined_by_driver', // <-- NEW STATUS ADDED
}

export interface PaymentDetails {
  gateway: string;
  transactionId?: string;
  orderId?: string;
  paymentId?: string;
  status: 'success' | 'failed' | 'pending';
  amount: number;
  currency: string;
}

@Entity('bookings')
@Index(['userId', 'status', 'createdAt'])
@Index(['scheduledTripId', 'status'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: () => "'TEMP_CRN_' || uuid_generate_v4()" }) // Generates a temporary unique CRN
  crn: string;

  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency: string;

  @Column({ type: 'uuid', nullable: true }) // Can be nullable
  @Index() // Good to index if you search by it
  roundTripId?: string;

  @Column()
  userId: string;
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  scheduledTripId: string;
  @ManyToOne(() => ScheduledTrip, (trip) => trip.bookings, {
    nullable: true,
    onDelete: 'SET NULL',
  }) // Allow null if trip deleted
  @JoinColumn({ name: 'scheduledTripId' })
  scheduledTrip: ScheduledTrip;

  @Column()
  pickupStopId: string;
  @ManyToOne(() => RouteStop, {
    nullable: true,
    onDelete: 'SET NULL',
    eager: true,
  }) // Allow null, eager load
  @JoinColumn({ name: 'pickupStopId' })
  pickupStop: RouteStop;

  @Column()
  dropOffStopId: string;
  @ManyToOne(() => RouteStop, {
    nullable: true,
    onDelete: 'SET NULL',
    eager: true,
  }) // Allow null, eager load
  @JoinColumn({ name: 'dropOffStopId' })
  dropOffStop: RouteStop;

  @Column({ type: 'jsonb', default: [] }) // Default to empty array
  bookedSeatIds: string[];

  @Column({ type: 'int', default: 1 })
  numberOfSeatsBooked: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 }) // Default for baseFare
  baseFare: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  discountAmount: number;

  @Column({ type: 'varchar', length: 100, nullable: true }) // couponCodeApplied can be null
  couponCodeApplied?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 }) // Default for totalFarePaid
  totalFarePaid: number;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING_PAYMENT,
  })
  status: BookingStatus;

  @Column({ type: 'jsonb', nullable: true })
  paymentDetails?: {
    gateway: string;
    transactionId?: string;
    orderId?: string;
    paymentId?: string;
    status: 'success' | 'failed' | 'pending';
    amount: number;
  };

  @Column({ type: 'varchar', length: 255, default: 'One Way' }) // Default for rideType
  rideType: string;

  @Column({ type: 'text', nullable: true })
  cancellationReason?: string;
  
  // v-- THIS IS THE NEW FIELD WE ARE ADDING --v
  @Column({ type: 'text', nullable: true })
  driverDeclineReason?: string;
  // ^-- THIS IS THE NEW FIELD WE ARE ADDING --^

  @Column({ type: 'int', nullable: true })
  rating?: number;

  @Column({ type: 'text', nullable: true })
  feedbackComment?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  tipAmount?: number;

  @Column({ type: 'varchar', length: 6, nullable: true, select: false })
  boardingOtp?: string;

  @Column({ type: 'timestamptz', nullable: true, select: false })
  boardingOtpExpiresAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  @Index()
  tripDepartureDateTime?: Date;
  
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}