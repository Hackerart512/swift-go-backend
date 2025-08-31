// src/modules/suggestions/dto/create-route-suggestion.dto.ts
import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SuggestedRideType } from '../entities/route-suggestion.entity';

export class CreateRouteSuggestionDto {
  @ApiProperty({ description: 'Start location address', example: 'Lanco Hills, Hyderabad' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  startLocationAddress: string;

  @ApiProperty({ description: 'End location address', example: 'Wipro Circle, Hyderabad' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  endLocationAddress: string;

  @ApiProperty({ description: 'Type of ride suggested', enum: SuggestedRideType, example: 'pool' })
  @IsEnum(SuggestedRideType)
  @IsNotEmpty()
  rideType: SuggestedRideType;

  @ApiProperty({ description: 'Desired arrival time (HH:MM or HH:MM AM/PM)', example: '08:30 AM' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s?(AM|PM)?$/i, { // Basic time format like HH:MM or HH:MM AM/PM
    message: 'desiredArrivalTime must be a valid time format like HH:MM or HH:MM AM/PM',
  })
  @MaxLength(10)
  desiredArrivalTime: string;

  @ApiProperty({ description: 'Whether to update user profile preferences', example: false, required: false })
  @IsBoolean()
  @IsOptional()
  updateProfilePreferences?: boolean = false;

  @ApiProperty({ description: 'Additional suggestion text', example: 'Please add a stop at Gachibowli.', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  suggestionText?: string;
}