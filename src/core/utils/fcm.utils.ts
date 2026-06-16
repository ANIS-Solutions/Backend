// fcm.utils.ts
import { firebaseAdmin } from '@/config/firebase';
import { notificationModel } from '@/modules/notifications/notifications.model';
import { fcmActionTypes, HttpStatusCode } from '@anis/shared';
import { Message, MulticastMessage } from 'firebase-admin/messaging';
import mongoose from 'mongoose';

import AppError from './AppError.js';
import logger from './logger.js';

type FcmDataPayload = Record<string, string>;
const STALE_TOKEN_ERROR_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);
interface WithDevices {
  devices: { fcmToken: string }[];
}
export interface FcmSendResult {
  messageId: string;
  isStale: boolean;
}

export interface FcmMulticastResult {
  successCount: number;
  failureCount: number;
  staleTokens: string[];
}

export interface SilentPushOptions {
  fcmToken: string;
  action: fcmActionTypes;
  payload?: Record<string, unknown>;
}

interface SendNotificationOptions {
  recipientId: string;
  fcmToken: string;
  title: string;
  body: string;
  type: string;
  action: fcmActionTypes;
  payload?: Record<string, unknown>;
}

interface SendMulticastOptions {
  recipientId: string;
  fcmTokens: string[];
  title: string;
  body: string;
  type: string;
  action: fcmActionTypes;
  payload?: Record<string, unknown>;
}

export class FCMService {
  private static extractFcmErrorCode(error: unknown): string {
    if (
      error !== null &&
      typeof error === 'object' &&
      'errorInfo' in error &&
      typeof (error as { errorInfo: unknown }).errorInfo === 'object' &&
      (error as { errorInfo: { code?: unknown } }).errorInfo !== null &&
      typeof (error as { errorInfo: { code?: unknown } }).errorInfo.code ===
        'string'
    ) {
      return (error as { errorInfo: { code: string } }).errorInfo.code;
    }
    return '';
  }
  private static serializePayload(
    action: fcmActionTypes,
    payload?: Record<string, unknown>,
  ): FcmDataPayload {
    const serialized: FcmDataPayload = { action };

    if (!payload) return serialized;
    if ('action' in payload) {
      logger.warn(
        `FCM payload contains reserved key 'action' - it will be ignored.`,
      );
    }
    for (const [key, value] of Object.entries(payload)) {
      if (key === 'action') continue;

      if (typeof value === 'object' && value !== null) {
        try {
          serialized[key] = JSON.stringify(value);
        } catch {
          logger.warn(
            `FCM payload key '${key}' could not be serialized - skipped.`,
          );
        }
      } else {
        serialized[key] = String(value);
      }
    }
    return serialized;
  }
  private static handleFcmError(context: string, error: unknown): never {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`FCM ${context} Failed: ${message}`, error);
    throw new AppError(
      `FCM ${context} failed: ${message}`,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
  static async removeStaleFcmTokens<T extends WithDevices>(
    userModel: mongoose.Model<T>,
    recipientId: string,
    staleTokens: string[],
  ): Promise<void> {
    if (!staleTokens.length) return;

    await userModel.findByIdAndUpdate(recipientId, {
      $pull: {
        devices: { fcmToken: { $in: staleTokens } },
      },
    });

    logger.info(
      `Removed ${staleTokens.length} stale FCM tokens for ${userModel.modelName} ${recipientId}`,
    );
  }
  static async silentPush(
    // p0: {
    //   fcmToken: string;
    //   FcmAction: fcmActionTypes;
    //   '': any;
    // },
    // p1: {
    //   packageId: string;
    //   dailyLimit: number;
    //   limitExtended: boolean;
    //   timestamp: string;
    // },
    options: SilentPushOptions,
  ): Promise<FcmSendResult> {
    const { fcmToken, action, payload } = options;

    const message: Message = {
      token: fcmToken,
      data: this.serializePayload(action, payload),
      android: {
        priority: 'high',
      },
      // apns: {
      //   headers: {
      //     'apns-priority': '5',
      //     'apns-push-type': 'background',
      //   },
      //   payload: {
      //     aps: {
      //       contentAvailable: true,
      //     },
      //   },
      // },
    };

    try {
      const messageId = await firebaseAdmin.messaging().send(message);
      logger.info(
        `FCM Silent Push Sent [Action: ${action}] -> messageId: ${messageId}`,
      );
      return { messageId, isStale: false };
    } catch (error: unknown) {
      const code = this.extractFcmErrorCode(error);
      if (STALE_TOKEN_ERROR_CODES.has(code)) {
        logger.warn(
          `FCM Silent Push: stale token detected for action ${action}`,
        );
        return { messageId: '', isStale: true };
      }
      this.handleFcmError('Silent Push', error);
    }
  }

  /**
   * Single visible notification - shown in the device notification tray.
   * Also persists the notification to MongoDB.
   */
  static async sendNotification(
    options: SendNotificationOptions,
  ): Promise<FcmSendResult> {
    const { recipientId, fcmToken, title, body, type, action, payload } =
      options;

    const message: Message = {
      token: fcmToken,
      notification: { title, body },
      data: this.serializePayload(action, payload),

      android: {
        priority: 'high',
        notification: { sound: 'default' },
      },

      apns: {
        headers: {
          'apns-priority': '10',
          'apns-push-type': 'alert',
        },
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    try {
      const messageId = await firebaseAdmin.messaging().send(message);
      logger.info(
        `FCM Visible Push Sent [Title: ${title}] → messageId: ${messageId}`,
      );

      await notificationModel.create({
        recipientId: new mongoose.Types.ObjectId(recipientId),
        type,
        title,
        body,
        data: payload ?? null,
        isRead: false,
        readAt: null,
      });

      return { messageId, isStale: false };
    } catch (error: unknown) {
      const code = this.extractFcmErrorCode(error);
      if (STALE_TOKEN_ERROR_CODES.has(code)) {
        logger.warn(`FCM sendNotification: stale token detected`);
        return { messageId: '', isStale: true };
      }
      this.handleFcmError('Visible Push', error);
    }
  }

  /**
   * Multicast visible notification - fan-out to multiple devices.
   * Also persists one notification record to MongoDB if any send succeeded.
   */
  static async sendMulticastNotification(
    options: SendMulticastOptions,
  ): Promise<FcmMulticastResult> {
    const { recipientId, fcmTokens, title, body, type, action, payload } =
      options;

    if (fcmTokens.length === 0) {
      logger.warn(
        `FCM Multicast: no tokens provided for recipient ${recipientId}`,
      );
      return { successCount: 0, failureCount: 0, staleTokens: [] };
    }

    const message: MulticastMessage = {
      tokens: fcmTokens,
      notification: { title, body },
      data: this.serializePayload(action, payload),

      android: {
        priority: 'high',
        notification: { sound: 'default' },
      },

      apns: {
        headers: {
          'apns-priority': '10',
          'apns-push-type': 'alert',
        },
        payload: {
          aps: { sound: 'default', badge: 1 },
        },
      },
      webpush: {
        headers: {
          Urgency: 'high',
          TTL: '86400',
        },
        notification: {
          icon: '/icons/icon-192x192.png',
        },
      },
    };

    try {
      const response = await firebaseAdmin
        .messaging()
        .sendEachForMulticast(message);

      const staleTokens = response.responses.reduce<string[]>((acc, res, i) => {
        const token = fcmTokens[i];
        if (
          !res.success &&
          token &&
          STALE_TOKEN_ERROR_CODES.has(res.error?.code ?? '')
        ) {
          acc.push(token);
        }
        return acc;
      }, []);

      logger.info(
        `FCM Multicast: ${response.successCount} sent, ${response.failureCount} failed, ${staleTokens.length} stale tokens.`,
      );

      if (response.successCount > 0) {
        await notificationModel.create({
          recipientId: new mongoose.Types.ObjectId(recipientId),
          type,
          title,
          body,
          data: payload ?? null,
          isRead: false,
          readAt: null,
        });
      }

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        staleTokens,
      };
    } catch (error: unknown) {
      this.handleFcmError('Multicast', error);
    }
  }
}
