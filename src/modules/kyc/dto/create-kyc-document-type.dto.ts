// src/modules/kyc/dto/create-kyc-document-type.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateKycDocumentTypeDto {
  @ApiProperty({ description: 'Name of the document type', example: "Driver's License" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Optional description of the document type',
    example: 'A valid, non-expired driver license.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Is this document mandatory for all users of a certain type?',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiProperty({
    description: 'Is this document type active and available for selection?',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}