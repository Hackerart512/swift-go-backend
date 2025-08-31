import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DriversService } from '../drivers/drivers.service';
import { Driver, KycStatus } from '../drivers/entities/driver.entity';
import { KycService } from '../kyc/kyc.service';
import { SmsOtpService } from '../smsotp/sms-otp-service.service';
import { RequestPhoneOtpDto } from './dto/request-phone-otp.dto';
import { VerifyPhoneOtpDto } from './dto/verify-phone-otp.dto';
import { DriverRegistrationDto } from '../drivers/dto/driver-registration.dto';
import { InitiateKycDto } from './dto/initiate-kyc.dto';
import { VerifyKycOtpDto } from './dto/verify-kyc-otp.dto';
import { OtpPurpose } from '../smsotp/entities/otp.entity'; // <-- IMPORT THE PURPOSE ENUM

@Injectable()
export class DriverAuthService {
  constructor(
    private readonly driversService: DriversService,
    private readonly jwtService: JwtService,
    private readonly smsOtpService: SmsOtpService,
    private readonly kycService: KycService,
  ) {}

  async requestOtp(dto: RequestPhoneOtpDto): Promise<{ message: string }> {
    const { phoneNumber } = dto;
    // We don't need to check for the driver here. Just send the OTP.
    // The centralized service will handle saving it correctly.
    const result = await this.smsOtpService.sendAndSaveOtp(phoneNumber, OtpPurpose.DRIVER_LOGIN);
    if (!result.success) {
      throw new InternalServerErrorException('Failed to send OTP.');
    }
    return { message: result.message };
  }

  async verifyOtp(dto: VerifyPhoneOtpDto): Promise<{ accessToken: string; driver: Partial<Driver> }> {
    const { phoneNumber, otp } = dto;

    // Delegate verification to the centralized service
    const isValid = await this.smsOtpService.verifyOtp(phoneNumber, otp, OtpPurpose.DRIVER_LOGIN);

    if (!isValid) {
      throw new BadRequestException('OTP is invalid or has expired.');
    }

    // OTP is valid, now find or create the driver
    let driver = await this.driversService.findByMobileNumber(phoneNumber);
    if (!driver) {
      // If driver doesn't exist after a valid OTP, create a basic record
      driver = await this.driversService.createPartialDriver({
        mobileNumber: phoneNumber,
        isMobileVerified: true,
      });
    } else if (!driver.isMobileVerified) {
        // If driver exists but wasn't verified, mark as verified
        await this.driversService.updatePartialDriver(driver.id, { isMobileVerified: true });
        driver.isMobileVerified = true;
    }

    const payload = { sub: driver.id, role: 'driver' };
    const accessToken = this.jwtService.sign(payload);

    // Clean up the returned driver object (no sensitive data)
    const { password, phoneOtp, phoneOtpExpiresAt, ...result } = driver;
    return { accessToken, driver: result };
  }

  // ... other methods like completeRegistration, initiateKyc, etc., remain the same ...
  async completeRegistration(
    driverId: string,
    dto: DriverRegistrationDto,
  ): Promise<Driver> {
    return this.driversService.updateProfile(driverId, dto);
  }

  async initiateKyc(driverId: string, dto: InitiateKycDto): Promise<any> {
    const driver = await this.driversService.findById(driverId);
    if (!driver) throw new NotFoundException('Driver not found.');
    if (driver.kycStatus === KycStatus.VERIFIED)
      throw new ConflictException('KYC already verified.');
    const anotherDriver = await this.driversService.findByAadhaar(
      dto.aadhaarNumber,
    );
    if (anotherDriver && anotherDriver.id !== driverId)
      throw new ConflictException('Aadhaar already in use.');

    const kycResponse = await this.kycService.sendOtpToAadhaarLinkedMobile(
      dto.aadhaarNumber,
    );
    if (!kycResponse.success)
      throw new BadRequestException(
        kycResponse.message || 'Failed to initiate KYC.',
      );

    await this.driversService.updatePartialDriver(driverId, {
      kycTransactionId: kycResponse.transactionId,
    });

    return kycResponse;
  }

  async verifyKyc(driverId: string, dto: VerifyKycOtpDto): Promise<Driver> {
    const driver = await this.driversService.findById(driverId);
    if (!driver || driver.kycTransactionId !== dto.transactionId)
      throw new BadRequestException('Invalid KYC session.');

    const kycResult = await this.kycService.verifyAadhaarOtp(
      dto.aadhaarNumber,
      dto.otp,
      dto.transactionId,
    );
    if (!kycResult.success) {
      await this.driversService.updateKycStatus(
        driverId,
        KycStatus.FAILED,
        '',
        undefined,
      );
      throw new BadRequestException('Aadhaar verification failed.');
    }

    return this.driversService.updateKycStatus(
      driverId,
      KycStatus.VERIFIED,
      dto.aadhaarNumber,
      kycResult.userData,
    );
  }
}