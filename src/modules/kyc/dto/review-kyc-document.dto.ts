// src/modules/kyc/dto/review-kyc-document.dto.ts
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KycDocumentStatus } from '../entities/user-kyc-document.entity';

export class ReviewKycDocumentDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsEnum(['approved', 'rejected']) // Admin can only approve or reject
  @IsNotEmpty()
  status: KycDocumentStatus;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  reviewedById: string; // ID of the admin performing the review

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}