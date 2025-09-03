// src/modules/users/users.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { FavoriteLocation } from './entities/favorite-location.entity';
import { UserSubscription } from '../user-subscriptions/entities/user-subscription.entity';

// Enums remain the same
export enum KycStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export enum PhoneVerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
}

export enum UserGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export enum UserRole {
  PASSENGER = 'passenger',
  ADMIN = 'admin',
  DRIVER = 'driver',
}

export enum CommuteTimePreference {
  MORNING = 'morning',
  EVENING = 'evening',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  uid?: string;


  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  password?: string;

  @Column({ type: 'enum', enum: CommuteTimePreference, nullable: true })
  commutePreference?: CommuteTimePreference;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fullName?: string;

  @Column({ nullable: true })
  preferredMorningRouteOrigin?: string;

  @Column({ nullable: true })
  preferredMorningRouteDestination?: string;

  @Column({ nullable: true })
  preferredMorningArrivalTime?: string;

  @Column({ type: 'varchar', length: 12, unique: true, nullable: true })
  aadhaarNumber?: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ type: 'enum', enum: UserGender, nullable: true })
  gender?: UserGender;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  mobileNumber?: string;

  @Column({
    type: 'enum',
    enum: PhoneVerificationStatus,
    default: PhoneVerificationStatus.PENDING,
    nullable: true,
  })
  phoneVerificationStatus?: PhoneVerificationStatus;

  @Column({ type: 'varchar', length: 10, nullable: true, select: false })
  phoneOtp?: string | null;

  @Column({ type: 'timestamptz', nullable: true, select: false })
  phoneOtpExpiresAt?: Date | null;

  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.PENDING })
  kycStatus: KycStatus;

  @Column({ type: 'jsonb', nullable: true, select: false })
  kycDetails?: any;

  @Column({ type: 'varchar', length: 255, nullable: true })
  profilePhotoUrl?: string;

  @Column({ type: 'text', nullable: true })
  residentialLocation?: string;

  @Column({ type: 'text', nullable: true })
  workLocation?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  preferredTiming?: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: {
      from: (value: string) => parseFloat(value),
      to: (value: number) => value,
    },
  })
  walletBalance: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  driverProfileCompletedAt?: Date;
  
  // ++ ADD THIS COLUMN ++
  @Column({ type: 'varchar', nullable: true, comment: 'Firebase Cloud Messaging Token' })
  fcmToken?: string;
  // ++ END OF ADDED COLUMN ++

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => FavoriteLocation, (favLoc) => favLoc.user, { cascade: true })
  favoriteLocations: FavoriteLocation[];

  @OneToMany(
    () => UserSubscription,
    (subscription: UserSubscription) => subscription.user,
    {
      cascade: true,
    },
  )
  subscriptions: UserSubscription[];

  @Column({ type: 'enum', enum: UserRole, default: UserRole.PASSENGER })
  role: UserRole;

  @BeforeInsert()
  async hashPasswordOnInsert() {
    if (this.password) {
      if (
        !this.password.startsWith('$2a$') &&
        !this.password.startsWith('$2b$')
      ) {
        this.password = await bcrypt.hash(this.password, 10);
      }
    }
  }

  @BeforeUpdate()
  async hashPasswordOnUpdate() {
    if (this.password) {
      if (
        !this.password.startsWith('$2a$') &&
        !this.password.startsWith('$2b$')
      ) {
        this.password = await bcrypt.hash(this.password, 10);
      }
    }
  }

  async comparePassword(attempt: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(attempt, this.password);
  }
}