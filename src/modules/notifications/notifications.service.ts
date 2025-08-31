// src/modules/notifications/notifications.service.ts

import { Injectable, Inject, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FIREBASE_ADMIN } from '../firebase/firebase.module';
import { MulticastMessage } from 'firebase-admin/lib/messaging/messaging-api';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(@Inject(FIREBASE_ADMIN) private readonly firebaseAdmin: admin.app.App) {}

  /**
   * Sends a push notification to multiple devices.
   * @param tokens - An array of FCM registration tokens for the target devices.
   * @param title - The title of the notification.
   * @param body - The body text of the notification.
   * @param data - Optional data payload to send with the notification.
   */
  async sendPushNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: { [key: string]: string },
  ) {
    // Filter out any null, undefined, or empty tokens
    const validTokens = tokens.filter((token) => token && typeof token === 'string' && token.length > 0);

    if (validTokens.length === 0) {
      this.logger.warn('No valid FCM tokens provided. Skipping notification.');
      return;
    }

    const message: MulticastMessage = {
      notification: {
        title,
        body,
      },
      tokens: validTokens,
      data: data || {},
      android: {
        priority: 'high',
      },
      apns: { // Apple Push Notification Service configuration
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    };

    try {
      this.logger.log(`Attempting to send notification to ${validTokens.length} tokens.`);
      const response = await this.firebaseAdmin.messaging().sendEachForMulticast(message);
      this.logger.log(`Successfully sent message to ${response.successCount} devices.`);
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            this.logger.error(
              `Failed to send to token ${validTokens[idx]}:`,
              resp.error,
            );
          }
        });
      }
    } catch (error) {
      this.logger.error('Error sending push notification:', error);
    }
  }
}