// src/modules/drivers/entities/driver.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum DriverStatus {
  PENDING_APPROVAL = 'pending_approval',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected',
}

export enum KycStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed',
}

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fullName: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  @Index()
  email: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  @Index()
  mobileNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  password?: string;

  @Column({
    type: 'enum',
    enum: DriverStatus,
    default: DriverStatus.PENDING_APPROVAL,
  })
  status: DriverStatus;

  // --- NEW FIELD FOR REJECTION REASON ---
  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.PENDING })
  kycStatus: KycStatus;

  @Column({ type: 'varchar', length: 12, unique: true, nullable: true })
  aadhaarNumber?: string;

  @Column({ type: 'varchar', nullable: true })
  kycTransactionId?: string;

  @Column({ type: 'jsonb', nullable: true, select: false })
  kycDetails?: any;

  @Column({ type: 'varchar', length: 500, nullable: true })
  profilePhotoUrl?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  driversLicenseUrl?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  vehicleRcUrl?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  vehicleInsuranceUrl?: string;

  @Column({ type: 'double precision', nullable: true })
  currentLatitude?: number;

  @Column({ type: 'double precision', nullable: true })
  currentLongitude?: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isMobileVerified: boolean;

  @Column({ type: 'varchar', length: 10, nullable: true, select: false })
  phoneOtp?: string | null;

  @Column({ type: 'timestamptz', nullable: true, select: false })
  phoneOtpExpiresAt?: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}