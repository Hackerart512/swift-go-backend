// src/modules/notifications/notifications.module.ts

import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [FirebaseModule], // Import FirebaseModule to get access to FIREBASE_ADMIN
  providers: [NotificationsService],
  exports: [NotificationsService], // Export the service to be used in other modules
})
export class NotificationsModule {}