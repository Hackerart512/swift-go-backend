// src/modules/kyc/dto/update-kyc-document-type.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateKycDocumentTypeDto } from './create-kyc-document-type.dto';

// PartialType makes all fields from the Create DTO optional.
// This is perfect for update operations.
export class UpdateKycDocumentTypeDto extends PartialType(
  CreateKycDocumentTypeDto,
) {}