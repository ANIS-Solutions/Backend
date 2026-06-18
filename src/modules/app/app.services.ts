import { CacheService } from '@/core/cache/cache.service';
import AppError from '@/core/utils/AppError';
import { FCMService } from '@/core/utils/fcm.utils';
import logger from '@/core/utils/logger';
import {
  FcmAction,
  HttpStatusCode,
  IAppBase,
  IJwtPayload,
  NotificationType,
} from '@anis/shared';
import gplay from 'google-play-scraper';

import { ChildModel } from '../child/child.model.js';
import { ParentModel } from '../parent/parent.model.js';
import { toAppProfile } from './app.dto.js';
import { AppModel } from './app.model.js';
import {
  AddAppInput,
  AddBulkAppsInput,
  GetAppInput,
  GetAppsInput,
  RemoveAppInput,
  SetLimitBodyInput,
  SetLimitParamsInput,
  ToggleBlockBodyInput,
  ToggleBlockParamsInput,
  UpdateUsageAppBodyInput,
  UpdateUsageAppParamsInput,
} from './app.schema.js';
import { AppPackageModel } from './appPackage.model.js';

export interface BulkAppResult {
  packageId: string;
  status: 'created' | 'already_exists' | 'failed';
  reason?: string | undefined;
}

const titleFromPackageId = (packageId: string): string =>
  packageId.split('.').at(-1) ?? packageId;

const resolveAppPackage = async (packageId: string) => {
  const existing = await AppPackageModel.findById(packageId);
  if (existing) return existing;

  try {
    const info = await gplay.app({ appId: packageId });
    logger.info(`[AppPackage] Fetched from Play Store: ${packageId}`);

    return await AppPackageModel.create({
      _id: info.appId,
      title: info.title,
      categories: info.categories,
      url: info.url,
      iconUrl: info.icon,
      genreId: info.genreId,
      score: info.score,
      description: info.descriptionHTML,
      screenshots: info.screenshots,
      videoUrl: info.video,
    });
  } catch (err) {
    logger.warn(
      `[AppPackage] Play Store lookup failed for "${packageId}" — saving stub. ` +
        `Reason: ${err instanceof Error ? err.message : String(err)}`,
    );

    return await AppPackageModel.create({
      _id: packageId,
      title: titleFromPackageId(packageId),
    });
  }
};

const registerApp = async (
  childId: string,
  packageId: string,
  options: { bulk: boolean },
): Promise<IAppBase | null> => {
  const existingApp = await AppModel.findOne({ childId, packageId });
  if (existingApp) {
    if (options.bulk) return null;
    throw new AppError(
      `App "${packageId}" is already registered for this child.`,
      HttpStatusCode.CONFLICT,
    );
  }

  const appPackage = await resolveAppPackage(packageId);
  const newApp = await AppModel.create({ childId, packageId: appPackage.id });

  const child = await ChildModel.findById(childId)
    .select('firstName parentId')
    .lean();
  if (child) {
    const parent = await ParentModel.findById(child.parentId)
      .select('devices')
      .lean();
    if (parent && parent.devices.length > 0) {
      const fcmTokens = parent.devices.map((d) => d.fcmToken);
      const { staleTokens } = await FCMService.sendMulticastNotification({
        recipientId: child.parentId.toString(),
        fcmTokens,
        title: 'New App Installed',
        body: `${child.firstName} has installed ${appPackage.title}`,
        type: NotificationType.APP_INSTALLED,
        action: FcmAction.SYNC_APP_STATE,
        payload: { packageId, childId },
      });
      if (staleTokens.length > 0) {
        await FCMService.removeStaleFcmTokens(
          ParentModel,
          child.parentId.toString(),
          staleTokens,
        );
      }
    }
  }

  return toAppProfile(newApp);
};

export const addAppService = async (
  body: AddAppInput,
  user: IJwtPayload,
): Promise<IAppBase> => {
  const result = await registerApp(user.id, body.packageId, { bulk: false });
  return result!;
};

export const syncAppsService = async (
  input: AddBulkAppsInput,
  user: IJwtPayload,
): Promise<BulkAppResult[]> => {
  const childId = user.id;
  const packageIds = input.packagesId;
  // const packageIds: string[] = input.map(({ packageId }) => packageId);

  const settlements = await Promise.allSettled(
    packageIds.map((packageId) =>
      registerApp(childId, packageId, { bulk: true }),
    ),
  );
  logger.info(settlements);

  return settlements.map((settlement, i): BulkAppResult => {
    const packageId = packageIds[i]!;

    if (settlement.status === 'fulfilled') {
      return {
        packageId,
        status: settlement.value === null ? 'already_exists' : 'created',
      };
    }

    const reason =
      settlement.reason instanceof Error
        ? settlement.reason.message
        : String(settlement.reason);

    logger.error(
      `[AppSync] Failed to register "${packageId}" for child "${childId}": ${reason}`,
    );

    return { packageId, status: 'failed', reason };
  });
};

// const createAppPack = async (
//   childId: string,
//   appId: string,
//   bulk?: boolean,
// ): Promise<IAppBase | false> => {
//   let currApp = await AppModel.findOne({ childId, packageId: appId });
//   if (currApp) {
//     if (bulk) {
//       return false;
//     }
//     throw new AppError(
//       `App ${appId} already exists for this child`,
//       HttpStatusCode.CONFLICT,
//     );
//   }
//   let currAppPack = await AppPackageModel.findById(appId);
//   if (!currAppPack) {
//     const appPackInfo = await gplay.app({ appId });
//     logger.error('------------------logger.error--------------');
//     logger.error(appPackInfo);
//     logger.error('------------------logger.error--------------');
//     currAppPack = await AppPackageModel.create({
//       _id: appPackInfo.appId,
//       title: appPackInfo.title,
//       categories: appPackInfo.categories,
//       url: appPackInfo.url,
//       iconUrl: appPackInfo.icon,
//       genreId: appPackInfo.genreId,
//       score: appPackInfo.score,
//       description: appPackInfo.descriptionHTML,
//       screenshots: appPackInfo.screenshots,
//       videoUrl: appPackInfo.video,
//     });
//   }
//   currApp = await AppModel.create({
//     childId,
//     packageId: currAppPack.id,
//   });
//   return toAppProfile(currApp);
// };
// export const addAppService = async (
//   reqBody: AddAppInput,
//   reUser: IJwtPayload,
// ): Promise<IAppBase> => {
//   const { packageId } = reqBody;
//   const childId = reUser.id;
//   const currApp = (await createAppPack(childId, packageId)) as IAppBase;
//   return currApp;
// };

// export const addBulkAppsService = async (
//   reqBody: AddBulkAppsInput,
//   reUser: IJwtPayload,
// ): Promise<
//   IAppBase[] | { successfulToInstall: IAppBase[]; failedToInstall: string[] }
// > => {
//   const packageIds = reqBody;
//   const childId = reUser.id;
//   const successfulApps: IAppBase[] = [];
//   const failedApps = [];
//   for (const app of reqBody) {
//     const currApp = await createAppPack(childId, app.packageId, true);
//     if (!currApp) {
//       failedApps.push(`App ${app.packageId} already exists for this child`);
//     } else {
//       successfulApps.push(currApp);
//     }
//   }
//   if (failedApps.length) {
//     return {
//       successfulToInstall: successfulApps,
//       failedToInstall: failedApps,
//     };
//   }
//   return successfulApps;
// };

export const removeAppService = async (
  reqParams: RemoveAppInput,
): Promise<void> => {
  const { packageId, childId } = reqParams;
  const result = await AppModel.deleteOne({ packageId, childId });

  if (result.deletedCount === 0) {
    throw new AppError('App not found', HttpStatusCode.NOT_FOUND);
  }
};

export const toggleBlockAppService = async (
  reqParams: ToggleBlockParamsInput,
  reqBody: ToggleBlockBodyInput,
): Promise<IAppBase> => {
  const { packageId, childId } = reqParams;
  const { isBlocked } = reqBody;
  const currApp = await AppModel.findOneAndUpdate(
    { packageId, childId },
    { $set: { 'settings.isBlocked': isBlocked } },
    { new: true },
  ).lean();

  if (!currApp) {
    throw new AppError(
      `App with id ${packageId} not found`,
      HttpStatusCode.NOT_FOUND,
    );
  }
  const blockKey = `block:child:${childId}:${packageId}`;
  await CacheService.setWithTTL(blockKey, String(isBlocked), 24 * 60 * 60);
  if (!isBlocked) {
    const todayDate = new Date().toISOString().split('T')[0];
    await CacheService.delete(
      `breached:child:${childId}:${packageId}:${todayDate}`,
    );
  }
  let fcmToken = await CacheService.get(`fcm:child:${childId}`);
  if (!fcmToken) {
    const child = await ChildModel.findById(childId).select('fcmToken').lean();
    if (child?.fcmToken) {
      fcmToken = child.fcmToken;
      await CacheService.setWithTTL(
        `fcm:child:${childId}`,
        fcmToken,
        48 * 60 * 60,
      );
    }
  }

  if (fcmToken) {
    await FCMService.silentPush({
      fcmToken,
      action: FcmAction.SYNC_APP_STATE,
      payload: {
        packageId,
        isBlocked,
        timestamp: new Date().toISOString(),
      },
    });
  }

  return toAppProfile(currApp);
};

export const limitAppService = async (
  reqParams: SetLimitParamsInput,
  reqBody: SetLimitBodyInput,
): Promise<IAppBase> => {
  const { packageId, childId } = reqParams;
  const { dailyLimit } = reqBody;

  const currApp = await AppModel.findOneAndUpdate(
    { packageId, childId },
    { $set: { 'settings.dailyLimit': dailyLimit } },
    { new: true },
  );

  if (!currApp) {
    throw new AppError(
      `App with id ${packageId} not found`,
      HttpStatusCode.NOT_FOUND,
    );
  }

  const todayDate = new Date().toISOString().split('T')[0];
  const limitKey = `limit:child:${childId}:${packageId}`;
  const breachLockKey = `breached:child:${childId}:${packageId}:${todayDate}`;
  let limitWasExtended = false;
  const currCacheLimitStr = await CacheService.get(limitKey);
  if (currCacheLimitStr) {
    const oldLimit = parseInt(currCacheLimitStr, 10);
    if (oldLimit < dailyLimit) {
      await CacheService.delete(breachLockKey);
      limitWasExtended = true;
    }
  } else {
    await CacheService.delete(breachLockKey);
    limitWasExtended = true;
  }
  await CacheService.update(limitKey, String(dailyLimit));
  let fcmToken = await CacheService.get(`fcm:child:${childId}`);
  if (!fcmToken) {
    const child = await ChildModel.findById(childId).select('fcmToken').lean();
    if (child?.fcmToken) {
      fcmToken = child.fcmToken;
      await CacheService.setWithTTL(
        `fcm:child:${childId}`,
        fcmToken,
        48 * 60 * 60,
      );
    }
  }

  if (fcmToken) {
    await FCMService.silentPush({
      fcmToken,
      action: FcmAction.SYNC_APP_STATE,
      payload: {
        packageId,
        dailyLimit,
        limitExtended: limitWasExtended,
        timestamp: new Date().toISOString(),
      },
    });
  }
  return toAppProfile(currApp);
};

export const getAppService = async (
  reqParams: GetAppInput,
): Promise<IAppBase> => {
  const { packageId, childId } = reqParams;

  const currApp = await AppModel.findOne({ packageId, childId });

  if (!currApp) {
    throw new AppError(
      `App with id ${packageId} not found`,
      HttpStatusCode.NOT_FOUND,
    );
  }

  return toAppProfile(currApp);
};

export const getAppsService = async (
  reqParams: GetAppsInput,
): Promise<IAppBase[]> => {
  const { childId } = reqParams;

  const childApps = await AppModel.find({ childId })
    .populate('packageId')
    .lean();

  if (!childApps) {
    throw new AppError(`Apps not found`, HttpStatusCode.NOT_FOUND);
  }

  return childApps.map(toAppProfile);
};

/* 

  key: 
  usage:child:${childId}:${appPackage}:${timestamp}
  usage_limit:${childId}:${appPackage}

*/
const SECONDS_IN_DAY = 24 * 60 * 60;
const TTL_48_HOURS = 48 * 60 * 60;
export const updateUsageAppService = async (
  reqParams: UpdateUsageAppParamsInput,
  reqBody: UpdateUsageAppBodyInput,
  reqUser: IJwtPayload,
): Promise<{
  packageId: string;
  limitReached: boolean;
  isBlocked: boolean;
  remaining: number;
}> => {
  const { packageId } = reqParams;
  const { duration, timestamp, isLive, additionalData } = reqBody;
  const childId = reqUser.id;

  const todayDate = new Date().toISOString().split('T')[0];
  const usageKey = `usage:child:${childId}:${packageId}:${todayDate}`;
  const limitKey = `limit:child:${childId}:${packageId}`;
  const blockKey = `block:child:${childId}:${packageId}`;
  const breachLockKey = `breached:child:${childId}:${packageId}:${todayDate}`;

  // const redisKey = `usage:child:${childId}:${packageId}:${timestamp.getDate()}`;
  // const limitRedisKey = `usage_limit:child:${childId}:${packageId}`;

  const currentUsage = await CacheService.incby(usageKey, duration);
  // const currAppChildUsage = await CacheService.incby(redisKey, duration);
  if (currentUsage === duration) {
    await CacheService.setTTL(usageKey, TTL_48_HOURS);
  }
  const [appLimitStr, isBlockedStr] = await CacheService.mGet([
    limitKey,
    blockKey,
  ]);
  // const appLimitStr = await CacheService.get(limitKey);
  let appLimit = appLimitStr ? parseInt(appLimitStr, 10) : null;
  let isBlocked = isBlockedStr === 'true';
  if (appLimit === null || isBlockedStr === null) {
    const currAppChild = await AppModel.findOne({ childId, packageId }).lean();
    if (!currAppChild) {
      throw new AppError(
        `App tracking not configured`,
        HttpStatusCode.NOT_FOUND,
      );
    }

    appLimit =
      currAppChild.settings.dailyLimit > 0
        ? currAppChild.settings.dailyLimit
        : SECONDS_IN_DAY;
    isBlocked = currAppChild.settings.isBlocked ?? false;
    await CacheService.setWithTTL(limitKey, String(appLimit), SECONDS_IN_DAY);
    await CacheService.setWithTTL(blockKey, String(isBlocked), SECONDS_IN_DAY);
  }
  const remaining = Math.max(0, appLimit - currentUsage);
  const limitReached = remaining === 0;

  const shouldLock = limitReached || isBlocked;
  if (shouldLock) {
    const alreadyBreached = await CacheService.get(breachLockKey);

    if (!alreadyBreached) {
      let fcmToken = await CacheService.get(`fcm:child:${childId}`);
      if (!fcmToken) {
        const child = await ChildModel.findById(childId)
          .select('fcmToken')
          .lean();
        if (child?.fcmToken) {
          fcmToken = child.fcmToken;
          await CacheService.setWithTTL(
            `fcm:child:${childId}`,
            fcmToken,
            TTL_48_HOURS,
          );
        }
      }
      if (fcmToken) {
        await FCMService.silentPush({
          fcmToken,
          action: FcmAction.SYNC_APP_STATE,
          payload: {
            packageId,
            isBlocked,
            limitReached,
            timestamp: new Date().toISOString(),
          },
        });
      }

      if (limitReached) {
        const child = await ChildModel.findById(childId)
          .select('firstName parentId')
          .lean();
        if (child) {
          const parent = await ParentModel.findById(child.parentId)
            .select('devices')
            .lean();
          if (parent && parent.devices.length > 0) {
            const parentTokens = parent.devices.map((d) => d.fcmToken);
            const { staleTokens } = await FCMService.sendMulticastNotification({
              recipientId: child.parentId.toString(),
              fcmTokens: parentTokens,
              title: 'App Limit Reached',
              body: `${child.firstName} has reached their daily limit for this app`,
              type: NotificationType.LIMIT_REACHED,
              action: FcmAction.SYNC_APP_STATE,
              payload: { packageId, childId },
            });
            if (staleTokens.length > 0) {
              await FCMService.removeStaleFcmTokens(
                ParentModel,
                child.parentId.toString(),
                staleTokens,
              );
            }
          }
        }
      }

      await CacheService.setWithTTL(breachLockKey, 'locked', SECONDS_IN_DAY);
    }
  }

  return {
    packageId,
    limitReached,
    isBlocked,
    remaining,
  };
};
