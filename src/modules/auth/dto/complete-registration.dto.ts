// src/modules/auth/dto/complete-registration.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
} from 'class-validator';

export enum UserGender { // Optional: Use an enum for Gender
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export class CompleteRegistrationDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  fullName: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string; // UI shows it as optional (no red asterisk)

  @IsOptional()
  @IsEnum(UserGender) // Use enum if you define one
  // @IsOptional() @IsString() @MaxLength(50) // Or just string
  gender?: UserGender;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  residentialLocation?: string; // Free text for now

  @IsOptional()
  @IsString()
  @MaxLength(500)
  workLocation?: string; // Free text for now

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s?(AM|PM)?$/i, {
    // Basic time format
    message:
      'Preferred timing must be a valid time format like HH:MM or HH:MM AM/PM',
  })
  preferredTiming?: string; // e.g., "09:00 AM" or "5:30 PM"

  @IsNotEmpty() // Password should be required to "Register now"
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  // Add other password complexity rules if desired (e.g., @Matches for uppercase, number, symbol)
  password: string;
}
