// src/modules/drivers/dto/reject-driver.dto.ts

import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class RejectDriverDto {
  @IsString()
  @IsNotEmpty({ message: 'A rejection reason is required.' })
  @MaxLength(500)
  rejectionReason: string;
}