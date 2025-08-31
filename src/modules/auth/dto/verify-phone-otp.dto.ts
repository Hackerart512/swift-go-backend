// src/modules/auth/dto/verify-phone-otp.dto.ts
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class VerifyPhoneOtpDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format.' })
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  // --- FIX APPLIED HERE: Changed from 5 to 6 to match the generated OTP ---
  @Length(6, 6, { message: 'OTP must be exactly 6 digits.' })
  otp: string;
}