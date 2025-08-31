// src/modules/auth/dto/verify-kyc-otp.dto.ts
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyKycOtpDto {
  @IsNotEmpty()
  @IsString()
  @Length(12, 12)
  aadhaarNumber: string;

  @IsNotEmpty()
  @IsString()
  @Length(4, 6) // OTP length, adjust as per UIDAI/your provider
  otp: string;

  @IsNotEmpty() // If required
  @IsString()
  transactionId: string; // Add this property
}