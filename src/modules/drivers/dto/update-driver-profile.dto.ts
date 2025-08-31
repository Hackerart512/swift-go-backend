import { IsOptional, IsString, IsEmail, MaxLength } from 'class-validator';

export class UpdateDriverProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  // Add more fields as needed for updating the driver profile
}
