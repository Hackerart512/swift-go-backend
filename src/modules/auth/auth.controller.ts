// src/modules/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RequestPhoneOtpDto } from './dto/request-phone-otp.dto';
import { VerifyPhoneOtpDto } from './dto/verify-phone-otp.dto';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { LoginDto } from './dto/login-user.dto';
import { InitiateKycDto } from './dto/initiate-kyc.dto';
import { VerifyKycOtpDto as VerifyAadhaarKycOtpDto } from './dto/verify-kyc-otp.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserJwtAuthGuard } from './guards/user-jwt-auth.guard';
import { VerifyUidDto } from './dto/verify-uid-dto';

@ApiTags('Auth')
@Controller('auth')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
// --- THIS IS THE CRITICAL FIX: The 'export' keyword must be here ---
export class AuthController {
  constructor(private readonly authService: AuthService) {}

 
  @Post('uid/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify user by UID and Email (Google/Provider login)' })
  async verifyUid(@Body() verifyUidDto: VerifyUidDto) {
    return this.authService.verifyUid(verifyUidDto);
  }


  @Post('phone/request-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request OTP for phone number' })
  async requestPhoneOtp(@Body() requestPhoneOtpDto: RequestPhoneOtpDto) {
    return this.authService.requestPhoneOtp(requestPhoneOtpDto);
  }

  @Post('phone/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify phone OTP' })
  async verifyPhoneOtp(@Body() verifyPhoneOtpDto: VerifyPhoneOtpDto) {
    return this.authService.verifyPhoneOtp(verifyPhoneOtpDto);
  }

  @Post('complete-registration')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Complete user registration after phone OTP' })
  async completeFullRegistration(@Body() completeRegistrationDto: CompleteRegistrationDto) {
    // NOTE: This assumes `userId` is part of the DTO. Ensure your DTO reflects this.
    return this.authService.completeFullRegistration(
        completeRegistrationDto.userId,
        completeRegistrationDto,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with password (email, phone, or aadhaar)' })
  async loginWithPassword(@Body() loginDto: LoginDto) {
    return this.authService.loginWithPassword(loginDto);
  }

  @UseGuards(UserJwtAuthGuard)
  @Post('kyc/initiate')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate Aadhaar KYC (protected)' })
  async initiateAadhaarKyc(@Request() req, @Body() initiateKycDto: InitiateKycDto) {
    const userId = req.user.id || req.user.sub;
    return this.authService.initiateKyc(userId, initiateKycDto);
  }

  @UseGuards(UserJwtAuthGuard)
  @Post('kyc/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify Aadhaar KYC OTP (protected)' })
  async verifyAadhaarKycOtp(@Request() req, @Body() verifyAadhaarKycOtpDto: VerifyAadhaarKycOtpDto) {
    const userId = req.user.id || req.user.sub;
    return this.authService.verifyAadhaarKyc(userId, verifyAadhaarKycOtpDto);
  }

  @Post('kyc/skip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Skip Aadhaar KYC' })
  async skipAadhaarKyc(@Body('aadhaarNumber') aadhaarNumber?: string) {
    return this.authService.handleKycSkip(aadhaarNumber);
  }

  @Post('register/after-kyc')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register after Aadhaar KYC' })
  async registerAfterAadhaarKyc(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.registerAfterKyc(registerUserDto);
  }

  @UseGuards(UserJwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile (protected)' })
  getCurrentUser(@Request() req) {
    return {
        message: "Authenticated user profile.",
        user: req.user
    };
  }
}