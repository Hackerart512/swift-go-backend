// src/modules/auth/dto/request-phone-otp.dto.ts

import { IsNotEmpty, IsString, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Recommended for clear API docs

export class RequestPhoneOtpDto {
  @ApiProperty({
    description: 'User\'s full phone number including country code.',
    example: '+918238658110',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Invalid phone number format. Include country code e.g. +91XXXXXXXXXX',
  })
  phoneNumber: string;

  // ++ ADD THIS NEW PROPERTY ++
  @ApiProperty({
    description: 'Firebase Cloud Messaging (FCM) device token.',
    example: 'eJt-3a..._fcm_token_here...-1aC',
    required: false, // It is not mandatory
  })
  @IsOptional() // This validator marks the field as optional
  @IsString()   // Ensures if it is provided, it's a string
  fcmToken?: string;
  // ++ END OF ADDED PROPERTY ++
}