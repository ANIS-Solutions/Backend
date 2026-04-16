import { IAppBase } from '@anis/shared';
import { Types } from 'mongoose';

import { IApp } from './app.model.js';

type LeanApp = Omit<IAppBase, 'id'> &
  Required<{ _id: Types.ObjectId }> & { __v: number };

export const toAppProfile = (app: IApp | LeanApp): IAppBase => {
  const safeId = (app as IApp).id || (app as LeanApp)._id.toString();
  const safeChildId =
    (app as IApp).childId.toString() || (app as LeanApp).childId.toString();
  const safePackId =
    (app as IApp).packageId.toString() || (app as LeanApp).packageId.toString();

  return {
    childId: safeChildId,
    packageId: safePackId,
    settings: {
      isBlocked: app.settings.isBlocked,
      dailyLimit: app.settings.dailyLimit,
    },
    ...(app.stats && {
      stats: {
        firstInstallAt: app.stats.firstInstallAt,
        lastOpenedAt: app.stats.lastOpenedAt,
        totalUsage: app.stats.totalUsage,
        dailyUsage: app.stats.dailyUsage,
      },
    }),
  };
};
