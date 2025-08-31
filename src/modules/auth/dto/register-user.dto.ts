import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
export class RegisterUserDto {
  @IsNotEmpty()
  @IsString()
  userId: string; // ID of the user record created/updated during KYC

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  mobileNumber?: string; // User's preferred contact number
}
