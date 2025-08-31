import { IsNotEmpty, IsString, Length } from 'class-validator';
export class InitiateKycDto {
  @IsNotEmpty()
  @IsString()
  @Length(12, 12) // Aadhaar is 12 digits
  aadhaarNumber: string;
}