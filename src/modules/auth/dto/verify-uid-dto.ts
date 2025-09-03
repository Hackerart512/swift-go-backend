import { IsNotEmpty, IsEmail, IsOptional, IsString } from 'class-validator';

export class VerifyUidDto {
  @IsNotEmpty()
  @IsString()
  uid: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}
