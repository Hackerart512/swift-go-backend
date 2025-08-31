import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class LoginDto {
  @ApiProperty({ description: 'User identifier (email, phone, or aadhaar number)', example: 'user@example.com' })
  @IsNotEmpty()
  @IsString()
  // @IsEmail() // Or allow login with aadhaarNumber/mobile if desired
  identifier: string; // Could be email, phone, or even aadhaarNumber

  @ApiProperty({ description: 'User password', example: 'strongPassword123' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;
}
