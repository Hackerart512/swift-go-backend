// src/modules/users/dto/create-user.dto.ts

import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { UserRole } from '../users.entity'; // We import the enum from our entity

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Full name should not be empty.' })
  fullName: string;

  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @IsNotEmpty({ message: 'Email should not be empty.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password should not be empty.' })
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  password: string;

  // These fields are optional for creation
  @IsString()
  @IsOptional()
  mobileNumber?: string;

  @IsString()
  @IsOptional()
  address?: string;

  // The HTML form sends a date as a string, so we validate it as such.
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  // This is critical for our admin panel to be able to create drivers.
  // We make it optional so that if it's not provided,
  // the default 'passenger' role from the entity is used.
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}