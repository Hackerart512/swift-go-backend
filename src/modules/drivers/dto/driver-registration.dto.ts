// src/modules/drivers/dto/driver-registration.dto.ts
import { IsString, IsNotEmpty, IsOptional, MaxLength, IsEmail } from 'class-validator';
// If you have a gender enum, import it. For now, using string.

export class DriverRegistrationDto {
  @IsString() @IsNotEmpty() @MaxLength(100)
  fullName: string;

  // The phone number is ALREADY verified and will be taken from the JWT,
  // so it doesn't need to be in this DTO unless you allow changing it here.

  @IsOptional() @IsEmail({}, { message: 'Please enter a valid email address.' })
  email?: string;

  @IsOptional() @IsString() @MaxLength(50)
  gender?: string;

  @IsString() @IsNotEmpty() @MaxLength(100)
  vehicleTypeInfo: string; // e.g., "Hatchback", "Sedan" from the text input

  @IsOptional() @IsString()
  aadhaarNumber?: string;

  @IsOptional ()
  @IsString() @IsNotEmpty()
  phoneNumber: string;
}