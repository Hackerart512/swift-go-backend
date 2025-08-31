// src/modules/user-subscriptions/entities/user-subscription.entity.ts
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
import { SubscriptionPlan } from '../../subscription-plans/entities/subscription-plan.entity';
import { Route } from '../../routes/entities/route.entity';
import { RouteStop } from '../../routes/entities/route-stop.entity';

export enum UserSubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  PENDING_PAYMENT = 'pending_payment',
  TRIAL = 'trial',
  SCHEDULED = 'scheduled', // --- MODIFICATION: Added new status ---
}

export enum SubscriptionCommuteType {
  MORNING = 'morning',
  EVENING = 'evening',
  ROUNDTRIP = 'roundtrip',
}

@Entity('user_subscriptions')
@Index(['userId', 'status'])
export class UserSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  planId: string;

  @ManyToOne(() => SubscriptionPlan, { eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'planId' })
  plan: SubscriptionPlan;

  @Column({ type: 'timestamptz' })
  startDate: Date;

  @Column({ type: 'timestamptz' })
  endDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  trialEndDate?: Date;

  @Column({
    type: 'enum',
    enum: UserSubscriptionStatus,
    default: UserSubscriptionStatus.PENDING_PAYMENT,
  })
  status: UserSubscriptionStatus;

  @Column({ type: 'int', nullable: true })
  remainingRides?: number;

  @Column({ type: 'jsonb', nullable: true })
  paymentDetails?: {
    gateway: string;
    transactionId: string;
    orderId?: string;
    amountPaid: number;
    currency: string;
  };

  @Column({ type: 'timestamptz', nullable: true })
  nextBillingDate?: Date;

  @Column({ default: false })
  autoRenew: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'uuid' })
  validForPickupStopId?: string;
  @ManyToOne(() => RouteStop)
  @JoinColumn({ name: 'validForPickupStopId' })
  validForPickupStop: RouteStop;

  @Column({ type: 'uuid', nullable: true })
  validForDropOffStopId?: string;
  @ManyToOne(() => RouteStop)
  @JoinColumn({ name: 'validForDropOffStopId' })
  validForDropOffStop: RouteStop;

  @Column({ type: 'enum', enum: SubscriptionCommuteType, nullable: true })
  commuteType?: SubscriptionCommuteType;
}