import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm'; // <-- 1. IMPORT TypeOrmModule
import { SmsOtpService } from './sms-otp-service.service';
import { Otp } from './entities/otp.entity'; // <-- 2. IMPORT our new Otp entity

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Otp]), // <-- 3. REGISTER the Otp repository
  ],
  providers: [SmsOtpService],
  exports: [SmsOtpService],
})
export class SmsOtpModule {}