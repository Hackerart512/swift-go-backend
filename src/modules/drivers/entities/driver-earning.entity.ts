import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Driver } from './driver.entity';
import { Booking } from '../../bookings/entities/booking.entity';

export enum EarningType {
    RIDE_FARE = 'ride_fare',
    TIP = 'tip',
    BONUS = 'bonus',
    WITHDRAWAL = 'withdrawal', // Represents a negative transaction
    ADJUSTMENT = 'adjustment',
}

@Entity('driver_earnings')
export class DriverEarning {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  driverId: string;
  @ManyToOne(() => Driver, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'driverId' })
  driver: Driver;

  @Column({ type: 'uuid', nullable: true })
  bookingId?: string; // Link to the booking that generated the earning
  @ManyToOne(() => Booking, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'bookingId' })
  booking?: Booking;

  @Column({ type: 'enum', enum: EarningType })
  type: EarningType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number; // Can be negative for withdrawals

  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency: string;

  @Column({ type: 'text' })
  description: string; // e.g., "Earning from booking CRN12345", "Weekly bonus", "Withdrawal request"

  @CreateDateColumn({ type: 'timestamptz' })
  transactionDate: Date;
}