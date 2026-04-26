import { firebaseAdmin } from '@/config/firebase';
import { fcmActionTypes, HttpStatusCode } from '@anis/shared';

import AppError from './AppError.js';
import logger from './logger.js';

export class FCMService {
  private static serializePayload(
    action: fcmActionTypes,
    payload?: Record<string, unknown>,
  ): Record<string, string> {
    const serialized: Record<string, string> = { action };

    if (!payload) return serialized;

    for (const [key, value] of Object.entries(payload)) {
      if (typeof value === 'object' && value !== null) {
        serialized[key] = JSON.stringify(value);
      } else {
        serialized[key] = String(value);
      }
    }
    return serialized;
  }

  static async silentPush(
    fcmToken: string,
    action: fcmActionTypes,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    try {
      const message = {
        token: fcmToken,
        data: this.serializePayload(action, payload),
        android: { priority: 'high' as const },
      };

      const response = await firebaseAdmin.messaging().send(message);
      logger.info(`FCM Silent Push Sent [Action: ${action}]: ${response}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error('FCM Silent Push Failed:', error);
      throw new AppError(
        `Failed to send silent sync to device. ${errorMessage}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }

  static async sendNotification(
    fcmToken: string,
    title: string,
    body: string,
    action: fcmActionTypes,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    try {
      const message = {
        token: fcmToken,
        notification: { title, body },
        data: this.serializePayload(action, payload),
        android: { priority: 'high' as const },
      };

      const response = await firebaseAdmin.messaging().send(message);
      logger.info(`FCM Visible Push Sent [Title: ${title}]: ${response}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error('FCM Visible Push Failed:', error);
      throw new AppError(
        `Failed to send notification to device. ${errorMessage}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }

  static async sendMulticastNotification(
    fcmTokens: string[],
    title: string,
    body: string,
    action: fcmActionTypes,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    if (!fcmTokens || fcmTokens.length === 0) return;

    try {
      const message = {
        tokens: fcmTokens,
        notification: { title, body },
        data: this.serializePayload(action, payload),
      };

      const response = await firebaseAdmin
        .messaging()
        .sendEachForMulticast(message);
      logger.info(
        `FCM Multicast Sent: ${response.successCount} successful, ${response.failureCount} failed.`,
      );
    } catch (error: unknown) {
      logger.error('FCM Multicast Failed:', error);
      throw new AppError(
        'Failed to broadcast notification to all devices.',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
