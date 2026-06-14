import ApiResponse from '@/core/handlers/api.handler';
import { catchAsync } from '@/core/utils/catchAsync';
import { HttpStatusCode } from '@anis/shared';
import { NextFunction, Request, Response } from 'express';

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
import {
  addAppService,
  getAppService,
  getAppsService,
  limitAppService,
  removeAppService,
  syncAppsService,
  toggleBlockAppService,
  updateUsageAppService,
} from './app.services.js';

export const addApp = catchAsync(
  async (
    req: Request<{}, {}, AddAppInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> => {
    const app = await addAppService(req.body, req.user!);
    return ApiResponse.success(
      res,
      HttpStatusCode.CREATED,
      'app added successfully',
      {
        data: app,
      },
    );
  },
);
export const addBulkApps = catchAsync(
  async (
    req: Request<{}, {}, AddBulkAppsInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> => {
    const apps = await syncAppsService(req.body, req.user!);
    return ApiResponse.success(
      res,
      HttpStatusCode.CREATED,
      'apps added successfully',
      {
        data: apps,
      },
    );
  },
);

export const removeApp = catchAsync(
  async (
    req: Request<RemoveAppInput, {}, {}>,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> => {
    await removeAppService(req.params);
    return ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'App removed successfully',
    );
  },
);

export const toggleBlockApp = catchAsync(
  async (
    req: Request<ToggleBlockParamsInput, {}, ToggleBlockBodyInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const currApp = await toggleBlockAppService(req.params, req.body);
    return ApiResponse.success(
      res,
      HttpStatusCode.OK,
      `App ${currApp.settings.isBlocked ? 'blocked' : 'unblocked'} successfully`,
      { data: currApp },
    );
  },
);

export const limitApp = catchAsync(
  async (
    req: Request<SetLimitParamsInput, {}, SetLimitBodyInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const currApp = await limitAppService(req.params, req.body);
    return ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'App limit updated successfully',
      { data: { settings: currApp.settings } },
    );
  },
);

export const getApp = catchAsync(
  async (
    req: Request<GetAppInput, {}, {}>,
    res: Response,
    next: NextFunction,
  ) => {
    const currApp = await getAppService(req.params);
    return ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'The child app is founded successfully.',
      { data: { app: currApp } },
    );
  },
);

export const getApps = catchAsync(
  async (
    req: Request<GetAppsInput, {}, {}>,
    res: Response,
    next: NextFunction,
  ) => {
    const childApps = await getAppsService(req.params);
    return res.status(HttpStatusCode.OK).json({
      success: true,
      message: 'The child apps is founded successfully.',
      data: { apps: childApps },
    });
  },
);

export const updateChildUsage = catchAsync(
  async (
    req: Request<UpdateUsageAppParamsInput, {}, UpdateUsageAppBodyInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const { packageId, limitReached, isBlocked, remaining } =
      await updateUsageAppService(req.params, req.body, req.user!);
    return res.status(HttpStatusCode.OK).json({
      success: true,
      message: `The app with packageId ${packageId}, ${
        limitReached
          ? 'is reached the limit'
          : isBlocked
            ? 'is blocked by parent'
            : 'has ' + remaining + ' seconds'
      }.`,
    });
  },
);
