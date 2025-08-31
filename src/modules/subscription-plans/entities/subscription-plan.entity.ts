// src/modules/subscription-plans/entities/subscription-plan.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
// import { UserSubscription } from '../../user-subscriptions/entities/user-subscription.entity'; // If UserSubscription is separate
import { UserSubscription } from '../../user-subscriptions/entities/user-subscription.entity';

export enum PlanDurationUnit {
  DAY = 'day',
  MONTH = 'month',
  YEAR = 'year',
}

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string; // e.g., "Monthly Saver", "Annual Pro", "5 Ride Pack"

  @Column({ type: 'text', nullable: true })
  description?: string; // e.g., "Unlimited rides for 30 days", "Includes 5 rides"

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency: string;

  @Column({ type: 'int' }) // How long this plan is valid for after purchase
  durationValue: number; // e.g., 1, 12, 30

  @Column({ type: 'enum', enum: PlanDurationUnit })
  durationUnit: PlanDurationUnit; // e.g., 'month', 'year', 'day'

  @Column({ type: 'int', nullable: true }) // Number of rides included. Null for unlimited within duration.
  ridesIncluded?: number;

  @Column({ type: 'int', default: 0 }) // Duration of free trial in days
  trialDays?: number;

  @Column({ default: true }) // Can admins toggle plan visibility/availability?
  isActive: boolean;

  @Column({ type: 'int', default: 0 }) // For ordering plans in UI
  sortOrder?: number;

  // @OneToMany(() => UserSubscription, userSub => userSub.plan) // If UserSubscription is separate
  // userSubscriptions: UserSubscription[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => UserSubscription, (userSub) => userSub.plan)
  userSubscriptions: UserSubscription[];
}
