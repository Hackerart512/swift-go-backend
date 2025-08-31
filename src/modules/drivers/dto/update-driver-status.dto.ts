// src/modules/drivers/dto/update-driver-status.dto.ts

import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { DriverStatus } from '../entities/driver.entity';

export class UpdateDriverStatusDto {
  @IsEnum(DriverStatus)
  status: DriverStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}