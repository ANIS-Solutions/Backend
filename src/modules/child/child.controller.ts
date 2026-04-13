import ApiResponse from '@/core/handlers/api.handler';
import { catchAsync } from '@/core/utils/catchAsync';
import logger from '@/core/utils/logger';
import { HttpStatusCode } from '@anis/shared';
import { NextFunction, Request, Response } from 'express';

import {
  CreateChildBodyInput,
  GetMyChildParamsInput,
  PairChildInput,
  UpdateChildBodyInput,
  UpdateChildParamsInput,
} from './child.schema.js';
import {
  addChildService,
  getMeService,
  GetMyChildrenService,
  getMyChildService,
  pairChildService,
  updateMyChildService,
} from './child.services.js';

export const addChildren = catchAsync(
  async (
    req: Request<{}, {}, CreateChildBodyInput>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    const { childData, pairingQrCode, pairToken } = await addChildService(
      req.user!,
      req.body,
    );
    ApiResponse.success(
      res,
      HttpStatusCode.CREATED,
      'Child added successfully!',
      {
        data: childData,
        qrcode: pairingQrCode,
        devInfo: {
          pairToken,
        },
      },
    );
  },
);

//=============== Get All Children =====================//
export const getMyChildren = catchAsync(
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    const childrenData = await GetMyChildrenService(req.user!);
    ApiResponse.success(res, HttpStatusCode.OK, 'The children data', {
      data: childrenData,
    });
  },
);

//=============== Get Single Children =====================//
export const getMyChild = catchAsync(
  async (
    req: Request<GetMyChildParamsInput>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    const childData = await getMyChildService(req.user!, req.params);
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'The child data is retrieved successfully',
      {
        data: childData,
      },
    );
  },
);

export const updateMyChild = catchAsync(
  async (
    req: Request<UpdateChildParamsInput, {}, UpdateChildBodyInput>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    const parentId = req.user!.id;
    const childId = req.params.childId;
    const newChildFields = req.body;
    const updatedChildData = await updateMyChildService(
      parentId,
      childId,
      newChildFields,
    );
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'The child data is updated successfully',
      {
        data: updatedChildData,
      },
    );
  },
);
export const pairChild = catchAsync(
  async (
    req: Request<{}, {}, PairChildInput>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    const pairChildPayload = req.body;
    const { childData, accessToken } = await pairChildService(pairChildPayload);
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'The child is paired successfully',
      {
        data: childData,
        accessToken,
      },
    );
  },
);
export const getMe = catchAsync(async (req: Request, res: Response, next) => {
  const currChild = await getMeService(req.user!.id);

  ApiResponse.success(res, HttpStatusCode.OK, 'Child profile from /me', {
    data: currChild,
  });
});
