// src/modules/auth/driver-auth.controller.ts
import { Controller, Post, Body, UseGuards, Request as NestRequest } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DriverAuthService } from './driver-auth.service';
import { DriverJwtAuthGuard } from './guards/driver-jwt-auth.guard';
import { RequestPhoneOtpDto } from './dto/request-phone-otp.dto';
import { VerifyPhoneOtpDto } from './dto/verify-phone-otp.dto';
import { InitiateKycDto } from './dto/initiate-kyc.dto';
import { VerifyKycOtpDto } from './dto/verify-kyc-otp.dto';
import { DriverRegistrationDto } from '../drivers/dto/driver-registration.dto';

@ApiTags('Auth (Driver Onboarding)')
@Controller('auth/driver')
export class DriverAuthController {
  // --- FIX: Remove the unnecessary authService injection ---
  constructor(private readonly driverAuthService: DriverAuthService) {}

  @Post('request-otp')
  @ApiOperation({ summary: 'Request OTP for a driver\'s phone number' })
  requestOtp(@Body() dto: RequestPhoneOtpDto) {
    return this.driverAuthService.requestOtp(dto);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP to log in or begin registration for a driver' })
  verifyOtp(@Body() dto: VerifyPhoneOtpDto) {
    return this.driverAuthService.verifyOtp(dto);
  }

  @Post('register')
  @UseGuards(DriverJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete driver profile registration (Protected)' })
  register(@NestRequest() req, @Body() dto: DriverRegistrationDto) {
    const driverId = req.user.id;
    return this.driverAuthService.completeRegistration(driverId, dto);
  }

  @Post('kyc/initiate')
  @UseGuards(DriverJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate Aadhaar KYC for the authenticated driver (Protected)' })
  initiateDriverKyc(@NestRequest() req, @Body() dto: InitiateKycDto) {
    const driverId = req.user.id;
    // --- FIX: Call the correct service ---
    return this.driverAuthService.initiateKyc(driverId, dto);
  }

  @Post('kyc/verify')
  @UseGuards(DriverJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify Aadhaar KYC OTP for the authenticated driver (Protected)' })
  verifyDriverKyc(@NestRequest() req, @Body() dto: VerifyKycOtpDto) {
    const driverId = req.user.id;
    // --- FIX: Call the correct service ---
    return this.driverAuthService.verifyKyc(driverId, dto);
  }
}