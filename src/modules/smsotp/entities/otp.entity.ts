import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum OtpPurpose {
  USER_REGISTRATION = 'user_registration',
  USER_LOGIN = 'user_login',
  DRIVER_LOGIN = 'driver_login',
  FORGOT_PASSWORD = 'forgot_password',
}

@Entity('otps')
export class Otp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 20 })
  identifier: string; // The phone number (+91...) or email address

  @Column({ length: 10 })
  code: string; // The 6-digit OTP

  @Column({ type: 'enum', enum: OtpPurpose })
  purpose: OtpPurpose;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ default: false })
  isUsed: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}