import { IAppBase } from '@anis/shared';
import { Types } from 'mongoose';

import { IApp } from './app.model.js';
import { IAppCategory, IAppPackage } from './appPackage.model.js';
import { IAppUsageDocument } from './appUsage.model.js';

export interface IDailyUsageProfile {
  id: string;
  date: string;
  totalScreenTimeMinutes: number;
  apps: {
    packageName: string;
    totalAppTimeMinutes: number;
    iconUrl: string | null;
  }[];
}

export interface IAppProfileResponse extends IAppBase {
  title?: string;
  categories?: IAppCategory[];
  url?: string;
  iconUrl?: string;
  genreId?: string;
  score?: number;
  description?: string;
  screenshots?: string[];
  videoUrl?: string;
}

type LeanApp = Omit<IAppBase, 'id'> &
  Required<{ _id: Types.ObjectId }> & { __v: number };

type AppWithMaybePopulatedPackage = (IApp | LeanApp) & {
  packageId: string | IAppPackage;
};

export const toAppProfile = (app: IApp | LeanApp): IAppProfileResponse => {
  const safeChildId =
    (app as IApp).childId?.toString() ||
    (app as LeanApp).childId?.toString() ||
    '';

  const appWithPkg = app as unknown as AppWithMaybePopulatedPackage;
  const rawPackage = appWithPkg.packageId;

  let safePackId = '';
  let packageData: IAppPackage | null = null;

  if (rawPackage && typeof rawPackage === 'object' && '_id' in rawPackage) {
    packageData = rawPackage as IAppPackage;
    safePackId = (packageData._id || packageData.id || '').toString();
  } else if (typeof rawPackage === 'string') {
    safePackId = rawPackage;
  } else if (rawPackage) {
    safePackId = String(rawPackage);
  }

  const response: IAppProfileResponse = {
    childId: safeChildId,
    packageId: safePackId,
    settings: {
      isBlocked: app.settings?.isBlocked ?? false,
      dailyLimit: app.settings?.dailyLimit ?? 0,
    },
    ...(app.stats && {
      stats: {
        firstInstallAt: app.stats.firstInstallAt,
        lastOpenedAt: app.stats.lastOpenedAt,
      },
    }),
  };

  if (packageData) {
    if (packageData.title != null) response.title = packageData.title;
    if (packageData.categories && packageData.categories.length > 0)
      response.categories = packageData.categories;
    if (packageData.url != null) response.url = packageData.url;
    if (packageData.iconUrl != null) response.iconUrl = packageData.iconUrl;
    if (packageData.genreId != null) response.genreId = packageData.genreId;
    if (packageData.score != null) response.score = packageData.score;
    if (packageData.description != null)
      response.description = packageData.description;
    if (packageData.screenshots && packageData.screenshots.length > 0)
      response.screenshots = packageData.screenshots;
    if (packageData.videoUrl != null) response.videoUrl = packageData.videoUrl;
  }

  return response;
};

export const toDailyUsageProfile = (
  usage: IAppUsageDocument,
  iconUrlMap: Map<string, string | null>,
): IDailyUsageProfile => {
  return {
    id: usage._id.toString(),
    date: usage.date.toISOString().split('T')[0] ?? '',
    totalScreenTimeMinutes: usage.totalScreenTimeMinutes,
    apps: usage.apps.map((app) => ({
      packageName: app.packageName,
      totalAppTimeMinutes: app.totalAppTimeMinutes,
      iconUrl: iconUrlMap.get(app.packageName) ?? null,
    })),
  };
};
