import { CacheService } from '@/core/cache/cache.service';
import AppError from '@/core/utils/AppError';
import { FCMService } from '@/core/utils/fcm.utils';
import { FcmAction, HttpStatusCode } from '@anis/shared';

import { ChildModel } from '../child/child.model.js';
import { screenCastRequestInput } from './screencast.schema.js';

export const requestScreenCastService = async (
  reqParams: screenCastRequestInput,
  parentId: string,
): Promise<void> => {
  const { childId } = reqParams;
  const child = await ChildModel.findOne({ _id: childId, parentId });
  if (!child) {
    throw new AppError(
      'Child not found or unauthorized',
      HttpStatusCode.FORBIDDEN,
    );
  }

  let fcmToken = await CacheService.get(`fcm:child:${childId}`);
  if (!fcmToken && child.fcmToken) {
    fcmToken = child.fcmToken;
  }

  if (!fcmToken) {
    throw new AppError(
      'Child device is offline or not paired',
      HttpStatusCode.BAD_REQUEST,
    );
  }

  await FCMService.silentPush({
    fcmToken,
    action: FcmAction.START_SCREEN_CAST,
    payload: {
      roomId: `screen_${childId}`,
      timestamp: new Date().toISOString(),
    },
  });
};
