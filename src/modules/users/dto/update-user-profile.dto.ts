// src/modules/users/dto/update-user-profile.dto.ts

import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
// --- IMPORT all enums from the entity file, our single source of truth ---
import { UserGender, CommuteTimePreference } from '../users.entity';

export class UpdateUserProfileDto {
  @ApiProperty({ description: 'Full name of the user', example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName?: string;

  @ApiProperty({ description: 'Gender of the user', enum: UserGender, example: UserGender.MALE, required: false })
  @IsOptional()
  @IsEnum(UserGender)
  gender?: UserGender;

  @ApiProperty({ description: 'Preferred morning route origin', example: 'Downtown', required: false })
  @IsOptional()
  @IsString()
  preferredMorningRouteOrigin?: string;

  @ApiProperty({ description: 'Preferred morning route destination', example: 'Airport', required: false })
  @IsOptional()
  @IsString()
  preferredMorningRouteDestination?: string;

  @ApiProperty({ description: 'Preferred morning arrival time', example: '08:30', required: false })
  @IsOptional()
  @IsString()
  preferredMorningArrivalTime?: string;

  @ApiProperty({ description: 'Commute time preference', enum: CommuteTimePreference, example: CommuteTimePreference.MORNING, required: false })
  @IsOptional()
  @IsEnum(CommuteTimePreference)
  commutePreference?: CommuteTimePreference;

  // ++ ADD THIS PROPERTY ++
  @ApiProperty({ description: 'Firebase Cloud Messaging device token', required: false })
  @IsOptional()
  @IsString()
  fcmToken?: string;
  // ++ END OF ADDED PROPERTY ++
}