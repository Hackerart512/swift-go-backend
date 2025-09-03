// src/modules/auth/auth.service.ts

/* eslint-disable @typescript-eslint/restrict-template-expressions */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
  Logger, // <-- Import Logger
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DriversService } from '../drivers/drivers.service';
import { Driver, DriverStatus } from '../drivers/entities/driver.entity';
import { VerifyPhoneOtpDto } from './dto/verify-phone-otp.dto';
import { UsersService } from '../users/users.service';
import { User, KycStatus as UserKycStatus, PhoneVerificationStatus, UserGender } from '../users/users.entity';
import { InitiateKycDto } from './dto/initiate-kyc.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login-user.dto';
import { KycService } from '../kyc/kyc.service';
import { SmsOtpService } from '../smsotp/sms-otp-service.service';
import { RequestPhoneOtpDto } from './dto/request-phone-otp.dto';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { ConfigService } from '@nestjs/config';
import { VerifyKycOtpDto } from './dto/verify-kyc-otp.dto';
import { OtpPurpose } from '../smsotp/entities/otp.entity';
import { VerifyUidDto  } from './dto/verify-uid-dto';

@Injectable()
export class AuthService {
  // ++ ADD THIS LINE ++
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly driversService: DriversService,
    private readonly jwtService: JwtService,
    private readonly smsOtpService: SmsOtpService,
    private readonly kycService: KycService,
    private readonly configService: ConfigService,
  ) {}

  // ====================================================================
  // ===== USER (PASSENGER) AUTHENTICATION FLOW =====
  // ====================================================================

  // async requestPhoneOtp(requestPhoneOtpDto: RequestPhoneOtpDto): Promise<{ message: string }> {
  //   // ++ MODIFICATION START ++
  //   const { phoneNumber, fcmToken } = requestPhoneOtpDto;

  //   // First, handle the fcmToken if it exists
  //   if (fcmToken) {
  //     this.logger.log(`FCM token received for phone ${phoneNumber}. Attempting to save.`);
  //     try {
  //       const user = await this.usersService.findByMobileNumber(phoneNumber);
  //       if (user) {
  //         // Update the existing user's token
  //         await this.usersService.updateFcmToken(user.id, fcmToken);
  //         this.logger.log(`Successfully updated FCM token for existing user ${user.id}.`);
  //       } else {
  //         this.logger.log(`User with phone ${phoneNumber} not found yet. FCM token will be handled upon registration.`);
  //       }
  //     } catch (error) {
  //       // Log the error but don't block the OTP flow
  //       this.logger.error(`Failed to update FCM token for ${phoneNumber}`, error.stack);
  //     }
  //   }
    
  //   // Then, proceed with sending the OTP as usual
  //   const otpResult = await this.smsOtpService.sendAndSaveOtp(phoneNumber, OtpPurpose.USER_LOGIN);

  //   if (!otpResult.success) {
  //     throw new InternalServerErrorException('Failed to send OTP.');
  //   }
  //   return { message: otpResult.message };
  //   // ++ MODIFICATION END ++
  // }

  async requestPhoneOtp(
  requestPhoneOtpDto: RequestPhoneOtpDto,
): Promise<{ message: string; code?: string }> {
  const { phoneNumber, fcmToken } = requestPhoneOtpDto;

  // Handle the fcmToken if provided
  if (fcmToken) {
    this.logger.log(
      `FCM token received for phone ${phoneNumber}. Attempting to save.`,
    );
    try {
      const user = await this.usersService.findByMobileNumber(phoneNumber);
      if (user) {
        await this.usersService.updateFcmToken(user.id, fcmToken);
        this.logger.log(
          `Successfully updated FCM token for existing user ${user.id}.`,
        );
      } else {
        this.logger.log(
          `User with phone ${phoneNumber} not found yet. FCM token will be handled upon registration.`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to update FCM token for ${phoneNumber}`,
        error.stack,
      );
    }
  }

  // Send and save OTP
  const otpResult = await this.smsOtpService.sendAndSaveOtp(
    phoneNumber,
    OtpPurpose.USER_LOGIN,
  );

  if (!otpResult.success) {
    throw new InternalServerErrorException('Failed to send OTP.');
  }

  // ✅ Return both message and code (code will only be present in dev/mock mode for safety)
  return {
    message: otpResult.message,
    code: otpResult.code, // add this (your service must return code too)
  };
}


  async verifyPhoneOtp(verifyDto: VerifyPhoneOtpDto): Promise<{
    message: string;
    accessToken: string;
    user: Partial<User>;
    isNewUser: boolean;
  }> {
    const { phoneNumber, otp } = verifyDto;
    const isOtpValid = await this.smsOtpService.verifyOtp(phoneNumber, otp, OtpPurpose.USER_LOGIN);
    
    if (!isOtpValid) {
      throw new BadRequestException('The OTP you entered is invalid or has expired.');
    }
    
    let user = await this.usersService.findByMobileNumber(phoneNumber);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await this.usersService.createUser({
        mobileNumber: phoneNumber,
        phoneVerificationStatus: PhoneVerificationStatus.VERIFIED,
        isActive: false, 
        kycStatus: UserKycStatus.PENDING,
      });
    } else if (user.phoneVerificationStatus !== PhoneVerificationStatus.VERIFIED) {
        user.phoneVerificationStatus = PhoneVerificationStatus.VERIFIED;
        await this.usersService.saveUser(user);
    }

    if (!user) {
        throw new InternalServerErrorException('Could not find or create user profile after OTP verification.');
    }

    isNewUser = isNewUser || !user.password;

    const payload = {
      sub: user.id,
      phone: user.mobileNumber,
      purpose: isNewUser ? 'complete-registration' : 'login',
      role: 'user',
    };
    const accessToken = this.jwtService.sign(payload);

    const { password, ...result } = user;
    return {
      message: 'Phone number verified successfully.',
      accessToken,
      user: result,
      isNewUser,
    };
  }
  
async verifyUid(dto: VerifyUidDto): Promise<{
  message: string;
  accessToken: string;
  user: Partial<User>;
  isNewUser: boolean;
}> {
  const { uid, email, fullName, photoUrl } = dto;

  console.log('Incoming DTO:', dto);

  let user: User | undefined = await this.usersService.findByUid(uid);
  let isNewUser = false;

  if (!user) {
    console.log('No user with UID, checking by email...');
    if (email) {
      user = await this.usersService.findByEmail(email);
    }


    if (user) {
      console.log('✅ Found user by email, updating UID...');
      user.uid = uid;
      user.fullName = user.fullName || fullName;
      user.profilePhotoUrl = user.profilePhotoUrl || photoUrl;
      await this.usersService.saveUser(user);
    } else {
      console.log('Creating new user...');
      isNewUser = true;
      user = await this.usersService.createUser({
        uid,
        email,
        fullName,
        profilePhotoUrl: photoUrl,
        phoneVerificationStatus: PhoneVerificationStatus.VERIFIED,
        kycStatus: UserKycStatus.PENDING,
        isActive: true,
      });
    }
  }

  if (!user) {
    console.error('Still no user after create/save!');
    throw new InternalServerErrorException(
      'Could not create or fetch user profile.',
    );
  }

  const payload = {
    sub: user.id,
    uid: user.uid,
    email: user.email,
    purpose: isNewUser ? 'complete-registration' : 'login',
    role: 'user',
  };

  const accessToken = this.jwtService.sign(payload);

  // remove password from response safely
  const { password, ...result } = user;

  return {
    message: isNewUser
      ? 'New user created successfully.'
      : 'User logged in successfully.',
    accessToken,
    user: result,
    isNewUser,
  };
}



  async completeFullRegistration(
    userId: string,
    registrationDetails: CompleteRegistrationDto,
  ): Promise<{ message: string; accessToken: string; user: Partial<User> }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found for registration completion.');
    }
    if (user.phoneVerificationStatus !== PhoneVerificationStatus.VERIFIED) {
      throw new BadRequestException('Phone number must be verified before completing registration.');
    }
    if (user.password) {
      throw new ConflictException('Account is already fully registered. Use profile update for changes.');
    }
    
    const updatedUser = await this.usersService.completeRegistration(userId, {
      password: registrationDetails.password,
      fullName: registrationDetails.fullName,
      email: registrationDetails.email,
      gender: registrationDetails.gender as UserGender,
      residentialLocation: registrationDetails.residentialLocation,
      workLocation: registrationDetails.workLocation,
      preferredTiming: registrationDetails.preferredTiming,
    });

    const payload = {
      sub: updatedUser.id,
      phone: updatedUser.mobileNumber,
      email: updatedUser.email,
      role: 'user',
    };
    const accessToken = this.jwtService.sign(payload);
    
    const { password, ...resultUser } = updatedUser;
    
    return {
      message: 'Registration completed successfully.',
      accessToken,
      user: resultUser,
    };
  }

  async loginWithPassword(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; user: Partial<User> }> {
    const { identifier, password: plainPasswordFromRequest } = loginDto;
    let user: User | undefined;

    if (identifier.startsWith('+') || /^\d{10,15}$/.test(identifier)) {
      user = await this.usersService.findByMobileNumber(identifier);
    } else if (identifier.includes('@')) {
      user = await this.usersService.findByEmail(identifier);
    } else if (/^\d{12}$/.test(identifier)) {
      user = await this.usersService.findByAadhaarNumber(identifier);
    }

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials or user not fully registered with a password.');
    }
    
    const isPasswordMatching = await user.comparePassword(plainPasswordFromRequest);
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid credentials.');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive.');
    }

    const jwtPayload = {
      sub: user.id,
      phone: user.mobileNumber,
      email: user.email,
      aadhaar: user.aadhaarNumber,
      role: 'user',
    };
    const accessToken = this.jwtService.sign(jwtPayload);
    
    const { password, ...resultUser } = user;
    
    return { accessToken, user: resultUser };
  }

  // ====================================================================
  // ===== USER KYC FLOW =====
  // ====================================================================

  async initiateKyc(loggedInUserId: string, initiateKycDto: InitiateKycDto) {
    const { aadhaarNumber } = initiateKycDto;
    const userWithThisAadhaar = await this.usersService.findByAadhaarNumber(aadhaarNumber);

    if (userWithThisAadhaar && userWithThisAadhaar.id !== loggedInUserId) {
      throw new ConflictException('This Aadhaar number is already linked to another account.');
    }
    
    const kycResponse = await this.kycService.sendOtpToAadhaarLinkedMobile(aadhaarNumber);
    if (!kycResponse.success) {
      throw new InternalServerErrorException(kycResponse.message || 'Failed to initiate KYC OTP process.');
    }
    return {
      message: kycResponse.message,
      transactionId: kycResponse.transactionId,
      ...(kycResponse.otpForTesting && { otpForTesting: kycResponse.otpForTesting }),
    };
  }

  async verifyAadhaarKyc(loggedInUserId: string, verifyAadhaarKycOtpDto: VerifyKycOtpDto) {
    const { aadhaarNumber, otp, transactionId } = verifyAadhaarKycOtpDto;
    
    const kycVerification = await this.kycService.verifyAadhaarOtp(aadhaarNumber, otp, transactionId);
    if (!kycVerification.success || !kycVerification.userData) {
      throw new BadRequestException(kycVerification.message || 'Aadhaar KYC OTP verification failed.');
    }
    const updatedUser = await this.usersService.updateUserKycDetails(loggedInUserId, aadhaarNumber, kycVerification.userData);
    return {
      message: 'Aadhaar KYC successfully verified and linked to your account.',
      user: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        kycStatus: updatedUser.kycStatus,
        aadhaarNumber: updatedUser.aadhaarNumber,
      },
    };
  }

  async handleKycSkip(aadhaarNumber?: string): Promise<{ message: string; user?: Partial<User> }> {
    let user: User | undefined;
    if (aadhaarNumber) {
        user = await this.usersService.findByAadhaarNumber(aadhaarNumber);
        if (user && user.kycStatus === UserKycStatus.VERIFIED) {
            throw new ConflictException('User already verified with this Aadhaar. Cannot skip KYC.');
        }
    }
    
    const skippedUser = await this.usersService.recordKycSkipped(aadhaarNumber, user);
    return {
      message: 'KYC skipped. You can proceed with basic registration.',
      user: { id: skippedUser.id, kycStatus: skippedUser.kycStatus },
    };
  }

  async registerAfterKyc(registerUserDto: RegisterUserDto): Promise<{ accessToken: string; user: Partial<User> }> {
    const { userId, password, email, mobileNumber } = registerUserDto;
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User profile not found for registration. Please complete KYC first.');
    }
    if (user.kycStatus !== UserKycStatus.VERIFIED || !user.aadhaarNumber) {
      throw new BadRequestException('Aadhaar KYC not verified for this user. Please complete Aadhaar KYC process.');
    }
    if (user.password) {
      throw new ConflictException('User account already has a password. Please login.');
    }

    const updatedUser = await this.usersService.completeRegistration(userId, { email, mobileNumber, password });
    
    const payload = {
      sub: updatedUser.id,
      aadhaar: updatedUser.aadhaarNumber,
      email: updatedUser.email,
      phone: updatedUser.mobileNumber,
      role: 'user',
    };
    const accessToken = this.jwtService.sign(payload);

    const { password: _, ...result } = updatedUser;
    return { accessToken, user: result };
  }
}