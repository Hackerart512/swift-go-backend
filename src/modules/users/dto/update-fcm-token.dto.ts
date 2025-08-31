// src/modules/users/dto/update-fcm-token.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateFcmTokenDto {
  @ApiProperty({
    description: 'The Firebase Cloud Messaging (FCM) device token.',
    example: 'cM-123...abc:XYZ-789...',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  fcmToken: string;
}