// src/modules/smsotp/sms-otp-service.service.ts

import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { add } from 'date-fns';
import * as Twilio from 'twilio';
import { Otp, OtpPurpose } from './entities/otp.entity';

@Injectable()
export class SmsOtpService {
  private readonly twilioClient: Twilio.Twilio;
  private readonly logger = new Logger(SmsOtpService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
  ) {
    const accountSid = configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = configService.get<string>('TWILIO_AUTH_TOKEN');
    if (!accountSid || !authToken) {
      this.logger.error(
        'Twilio credentials not found. SMS sending will fail.',
      );
      // Avoid throwing an error to allow the app to start, but log it.
      // A mock setup might still work without credentials.
    } else {
      this.twilioClient = Twilio(accountSid, authToken);
      this.logger.log('Twilio Client Initialized.');
    }
  }

  async sendAndSaveOtp(
    identifier: string,
    purpose: OtpPurpose,
  ): Promise<{ success: boolean; message: string }> {
    if (!identifier || !/^\+[1-9]\d{1,14}$/.test(identifier)) {
      throw new BadRequestException(
        'Invalid phone number format. Expected E.164 format.',
      );
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const twilioPhoneNumber = this.configService.get<string>(
      'TWILIO_PHONE_NUMBER',
    );
    const messageBody = `Your verification code is: ${otpCode}`;

    // Invalidate previous OTPs for the same purpose
    await this.otpRepository.update(
      { identifier, purpose, isUsed: false },
      { isUsed: true },
    );

    // Save the new OTP
    const expiryTime = add(new Date(), { minutes: 5 }); // 5 minute expiry
    const newOtp = this.otpRepository.create({
      identifier,
      code: otpCode,
      purpose,
      expiresAt: expiryTime,
    });
    await this.otpRepository.save(newOtp);

    // If mock OTP is enabled, we can skip sending the actual SMS to avoid charges/limits
    const isMockEnabled =
      this.configService.get<string>('MOCK_OTP_ENABLED') === 'true';
    if (isMockEnabled) {
      this.logger.warn(
        `Mock OTP is enabled. Skipping actual SMS send to ${identifier}. The real OTP is ${otpCode}`,
      );
      return {
        success: true,
        message: `OTP has been generated for ${identifier} (mock mode).`,
      };
    }

    // This block only runs if mock OTP is NOT enabled
    try {
      if (!this.twilioClient) {
        throw new InternalServerErrorException(
          'Twilio client is not initialized. Cannot send SMS.',
        );
      }
      await this.twilioClient.messages.create({
        body: messageBody,
        from: twilioPhoneNumber,
        to: identifier,
      });
      this.logger.log(
        `Successfully sent OTP to ${identifier} for purpose ${purpose}`,
      );
      return { success: true, message: `OTP has been sent to ${identifier}.` };
    } catch (error) {
      this.logger.error('Failed to send SMS via Twilio:', error);
      throw new InternalServerErrorException('Failed to send OTP message.');
    }
  }

  async verifyOtp(
    identifier: string,
    code: string,
    purpose: OtpPurpose,
  ): Promise<boolean> {
    // ===================================================================
    // === MOCK OTP IMPLEMENTATION =======================================
    // ===================================================================
    const isMockEnabled =
      this.configService.get<string>('MOCK_OTP_ENABLED') === 'true';
    const mockCode = this.configService.get<string>('MOCK_OTP_CODE');

    if (isMockEnabled && code === mockCode) {
      this.logger.warn(
        `Mock OTP (${mockCode}) used for ${identifier}. This should NOT be enabled in production.`,
      );
      return true; // Bypass database check and return true immediately
    }
    // ===================================================================
    // ===================================================================

    const otpRecord = await this.otpRepository.findOne({
      where: {
        identifier,
        purpose,
        code,
        isUsed: false,
      },
      order: { createdAt: 'DESC' }, // Get the most recent one
    });

    if (!otpRecord) {
      return false; // OTP not found
    }

    if (otpRecord.expiresAt < new Date()) {
      return false; // OTP expired
    }

    // Mark OTP as used so it cannot be reused
    otpRecord.isUsed = true;
    await this.otpRepository.save(otpRecord);

    return true;
  }
}