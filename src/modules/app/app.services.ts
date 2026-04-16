import AppError from '@/core/utils/AppError';
import logger from '@/core/utils/logger';
import { HttpStatusCode, IAppBase, IJwtPayload } from '@anis/shared';
import gplay from 'google-play-scraper';

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
} from './app.schema.js';
import { AppPackageModel } from './appPackage.model.js';

const createAppPack = async (
  childId: string,
  appId: string,
  bulk?: boolean,
): Promise<IAppBase | false> => {
  let currApp = await AppModel.findOne({ childId, packageId: appId });
  if (currApp) {
    if (bulk) {
      return false;
    }
    throw new AppError(
      `App ${appId} already exists for this child`,
      HttpStatusCode.CONFLICT,
    );
  }
  let currAppPack = await AppPackageModel.findById(appId);
  if (!currAppPack) {
    const appPackInfo = await gplay.app({ appId });
    currAppPack = await AppPackageModel.create({
      _id: appPackInfo.appId,
      title: appPackInfo.title,
      categories: appPackInfo.categories,
      url: appPackInfo.url,
      iconUrl: appPackInfo.icon,
      genreId: appPackInfo.genreId,
      score: appPackInfo.score,
      description: appPackInfo.descriptionHTML,
      screenshots: appPackInfo.screenshots,
      videoUrl: appPackInfo.video,
    });
  }
  currApp = await AppModel.create({
    childId,
    packageId: currAppPack.id,
  });
  return toAppProfile(currApp);
};

export const addAppService = async (
  reqBody: AddAppInput,
  reUser: IJwtPayload,
): Promise<IAppBase> => {
  const { packageId } = reqBody;
  const childId = reUser.id;
  const currApp = (await createAppPack(childId, packageId)) as IAppBase;
  return currApp;
};

export const addBulkAppsService = async (
  reqBody: AddBulkAppsInput,
  reUser: IJwtPayload,
): Promise<
  IAppBase[] | { successfulToInstall: IAppBase[]; failedToInstall: string[] }
> => {
  const packageIds = reqBody;
  const childId = reUser.id;
  const successfulApps: IAppBase[] = [];
  const failedApps = [];
  for (const app of reqBody) {
    const currApp = await createAppPack(childId, app.packageId, true);
    if (!currApp) {
      failedApps.push(`App ${app.packageId} already exists for this child`);
    } else {
      successfulApps.push(currApp);
    }
  }
  if (failedApps.length) {
    return {
      successfulToInstall: successfulApps,
      failedToInstall: failedApps,
    };
  }
  return successfulApps;
};

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

  const childApps = await AppModel.find({ childId });

  if (!childApps) {
    throw new AppError(`Apps not found`, HttpStatusCode.NOT_FOUND);
  }

  return childApps.map(toAppProfile);
};
