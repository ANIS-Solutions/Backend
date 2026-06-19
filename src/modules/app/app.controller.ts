import ApiResponse from '@/core/handlers/api.handler';
import { catchAsync } from '@/core/utils/catchAsync';
import { HttpStatusCode } from '@anis/shared';
import { NextFunction, Request, Response } from 'express';

import { toDailyUsageProfile } from './app.dto.js';
import {
  AddAppInput,
  AddBulkAppsInput,
  AddDailyUsageInput,
  GetAppInput,
  GetAppsInput,
  GetDailyUsageParams,
  GetDailyUsageQuery,
  PingAppUsageBody,
  PingAppUsageParams,
  RemoveAppInput,
  SetLimitBodyInput,
  SetLimitParamsInput,
  ToggleBlockBodyInput,
  ToggleBlockParamsInput,
} from './app.schema.js';
import {
  addAppService,
  addDailyUsageService,
  buildIconUrlMapForUsage,
  getAppService,
  getAppsService,
  getDailyUsageService,
  getLastWeekUsageService,
  limitAppService,
  pingAppUsageService,
  removeAppService,
  syncAppsService,
  toggleBlockAppService,
} from './app.services.js';
import { IAppUsageDocument } from './appUsage.model.js';

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

export const pingChildAppUsage = catchAsync(
  async (
    req: Request<PingAppUsageParams, {}, PingAppUsageBody>,
    res: Response,
    next: NextFunction,
  ) => {
    const { packageId, limitReached, isBlocked, remaining } =
      await pingAppUsageService(req.params, req.body, req.user!);
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

export const addDailyUsage = catchAsync(
  async (req: Request<unknown, unknown, AddDailyUsageInput>, res: Response) => {
    const childId = req.user!.id; // Authenticated child app
    const result = await addDailyUsageService(childId, req.body);
    const appMetaMap = await buildIconUrlMapForUsage([result]);
    ApiResponse.success(res, HttpStatusCode.OK, 'Daily usage saved', {
      data: toDailyUsageProfile(result, appMetaMap),
    });
  },
);

export const getDailyUsage = catchAsync(
  async (
    req: Request<GetDailyUsageParams, unknown, unknown, GetDailyUsageQuery>,
    res: Response,
  ) => {
    const childId = req.params.childId;
    const result = await getDailyUsageService(childId, req.query);

    const items = result.data.map((usage: IAppUsageDocument) =>
      toDailyUsageProfile(usage, result.appMetaMap),
    );

    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'Daily usage fetched successfully',
      {
        data: {
          items,
          total: result.total,
          page: result.page,
          limit: result.limit,
        },
      },
    );
  },
);

export const getLastWeekUsage = catchAsync(
  async (
    req: Request<GetDailyUsageParams, unknown, unknown, unknown>,
    res: Response,
  ) => {
    const childId = req.params.childId;
    const { data, appMetaMap } = await getLastWeekUsageService(childId);

    const mappedData = data.map((usage: IAppUsageDocument) =>
      toDailyUsageProfile(usage, appMetaMap),
    );

    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'Last week usage fetched successfully',
      { data: mappedData },
    );
  },
);
