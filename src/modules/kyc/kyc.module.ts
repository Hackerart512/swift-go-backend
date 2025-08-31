// src/modules/kyc/kyc.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KycService } from './kyc.service';
import { KycDocumentTypesService } from './kyc-document-types.service';
import { KycDocumentTypesController } from './kyc-document-types.controller';

// --- NEW IMPORTS FOR FULL KYC MANAGEMENT ---
import { AdminKycController } from './admin-kyc.controller'; // Our new controller for user docs
import { KycDocumentType } from './entities/kyc-document-type.entity';
import { UserKycDocument } from './entities/user-kyc-document.entity'; // The user's uploaded doc
import { User } from '../users/users.entity'; // We need the User entity

@Module({
  imports: [
    // --- UPDATED IMPORTS ARRAY ---
    // We provide all entities that our services in this module will need to query.
    TypeOrmModule.forFeature([
      KycDocumentType,
      UserKycDocument,
      User, 
    ]),
  ],

  controllers: [
    // --- UPDATED CONTROLLERS ARRAY ---
    // Both controllers are now registered
    KycDocumentTypesController, 
    AdminKycController,
  ],

  providers: [
    // --- UPDATED PROVIDERS ARRAY ---
    // Both services are available to the controllers
    KycService,
    KycDocumentTypesService,
  ],
  
  exports: [
    // --- EXPORTS for other modules if needed ---
    KycService,
    KycDocumentTypesService,
  ],
})
export class KycModule {}