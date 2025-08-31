// src/modules/firebase/firebase.module.ts

import { Module } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'path';

// This is a custom provider token we can use to inject Firebase Admin
export const FIREBASE_ADMIN = 'FIREBASE_ADMIN';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
      envFilePath: '.env',
    }),
  ],
  providers: [
    {
      provide: FIREBASE_ADMIN,
      useFactory: (configService: ConfigService) => {
        const serviceAccountPath = configService.get<string>(
          'FIREBASE_CREDENTIALS_PATH',
        );

        if (!serviceAccountPath) {
          throw new Error('FIREBASE_CREDENTIALS_PATH is not set in .env file');
        }

        // Use path.join for robust file path resolution
        const fullPath = path.join(process.cwd(), serviceAccountPath);
        
        // Check if Firebase app is already initialized
        if (admin.apps.length) {
          return admin.app();
        }

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const serviceAccount = require(fullPath);

        return admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [FIREBASE_ADMIN], // Export the provider so other modules can use it
})
export class FirebaseModule {}