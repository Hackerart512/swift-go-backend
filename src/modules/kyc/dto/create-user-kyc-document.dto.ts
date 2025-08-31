// src/modules/kyc/dto/create-user-kyc-document.dto.ts
import { IsNotEmpty, IsString, IsUrl, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserKycDocumentDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  documentTypeId: string;
  
  @ApiProperty()
  @IsUrl()
  @IsNotEmpty()
  documentUrl: string;
}