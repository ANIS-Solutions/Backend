import ApiResponse from '@/core/handlers/api.handler';
import { catchAsync } from '@/core/utils/catchAsync';
import logger from '@/core/utils/logger';
import { SseUtils } from '@/core/utils/sse.utils';
import { HttpStatusCode } from '@anis/shared';
import { NextFunction, Request, Response } from 'express';

import {
  AddLocationBodyInput,
  AddLocationParamsInput,
  GetAllLocationParamsInput,
  GetAllLocationQueryInput,
  GetLocationParamsInput,
  RemoveLocationParamsInput,
  StreamTelemetryParamsInput,
  TelemetryTrackLocationBodyInput,
  TelemetryTrackLocationParamsInput,
  UpdateLocationBodyInput,
  UpdateLocationParamsInput,
} from './location.schema.js';
import {
  addLocationService,
  getAllLocationService,
  getLocationService,
  removeLocationService,
  updateLocationService,
} from './location.services.js';
import {
  subscribeToLiveLocation,
  updateChildLocation,
} from './tracking.services.js';

export const addLocation = catchAsync(
  async (
    req: Request<AddLocationParamsInput, {}, AddLocationBodyInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const locData = await addLocationService(req.params, req.body);
    ApiResponse.success(
      res,
      HttpStatusCode.CREATED,
      'The new safe location is added successfully!',
      {
        data: locData,
      },
    );
  },
);
export const updateLocation = catchAsync(
  async (
    req: Request<UpdateLocationParamsInput, {}, UpdateLocationBodyInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const locData = await updateLocationService(req.params, req.body);
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      `The safe location with id (${req.params.locId}) is updated successfully!`,
      {
        data: locData,
      },
    );
  },
);

export const removeLocation = catchAsync(
  async (
    req: Request<RemoveLocationParamsInput>,
    res: Response,
    next: NextFunction,
  ) => {
    await removeLocationService(req.params);
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      `The location with id (${req.params.locId}) deleted successfully.`,
    );
  },
);

export const getLocation = catchAsync(
  async (
    req: Request<GetLocationParamsInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const locData = await getLocationService(req.params);
    return ApiResponse.success(res, HttpStatusCode.OK, 'Location retrieved', {
      data: locData,
    });
  },
);

export const getAllLocation = catchAsync(
  async (
    req: Request<GetAllLocationParamsInput, {}, {}, GetAllLocationQueryInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const locations = await getAllLocationService(req.params, req.query);
    return ApiResponse.success(res, HttpStatusCode.OK, 'Locations retrieved', {
      data: locations,
    });
  },
);

export const updateTrackLocation = catchAsync(
  async (
    req: Request<
      TelemetryTrackLocationParamsInput,
      {},
      TelemetryTrackLocationBodyInput
    >,
    res: Response,
  ) => {
    const childId = req.params.childId;

    await updateChildLocation(childId, req.body).catch(logger.error);

    return ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'Location is updated successfully.',
    );
  },
);

export const stream_location = catchAsync(
  async (
    req: Request<StreamTelemetryParamsInput>,
    res: Response,
  ): Promise<void> => {
    const { childId } = req.params;
    SseUtils.init(res);
    SseUtils.send(res, { message: 'Connected to live tracking' });

    const unsubscribe = await subscribeToLiveLocation(childId, (data) => {
      SseUtils.send(res, data);
    });
    req.on('close', () => {
      unsubscribe().catch(logger.error);
      res.end();
    });
  },
);
