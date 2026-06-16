import ApiResponse from '@/core/handlers/api.handler';
import { catchAsync } from '@/core/utils/catchAsync';
import { HttpStatusCode } from '@anis/shared';
import { NextFunction, Request, Response } from 'express';

import {
  AddRewardBodyInput,
  AddRewardParamsInput,
  GetAllRewardParamsInput,
  GetRewardParamsInput,
  RedeemRewardParamsInput,
  UpdateRewardBodyInput,
  UpdateRewardParamsInput,
} from './reward.schema.js';
import {
  addRewardService,
  deleteRewardService,
  getAllRewardService,
  getRewardService,
  redeemRewardService,
  updateRewardService,
} from './reward.services.js';

export const addReward = catchAsync(
  async (
    req: Request<AddRewardParamsInput, {}, AddRewardBodyInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const reward = await addRewardService(req.params, req.body);
    return ApiResponse.success(
      res,
      HttpStatusCode.CREATED,
      'Reward created successfully',
      { data: reward },
    );
  },
);

export const getReward = catchAsync(
  async (
    req: Request<GetRewardParamsInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const reward = await getRewardService(req.params);
    return ApiResponse.success(
      res,
      HttpStatusCode.CREATED,
      'Reward fetched OK.',
      { data: reward },
    );
  },
);

export const getAllReward = catchAsync(
  async (
    req: Request<GetAllRewardParamsInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const rewards = await getAllRewardService(req.params);
    return ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'Rewards fetched successfully.',
      { data: rewards },
    );
  },
);

export const updateReward = catchAsync(
  async (
    req: Request<UpdateRewardParamsInput, {}, UpdateRewardBodyInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const reward = await updateRewardService(req.params, req.body);
    return ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'Reward updated successfully.',
      { data: reward },
    );
  },
);

export const deleteReward = catchAsync(
  async (
    req: Request<GetRewardParamsInput>,
    res: Response,
    next: NextFunction,
  ) => {
    await deleteRewardService(req.params);
    return ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'Reward deleted successfully.',
    );
  },
);

export const redeemReward = catchAsync(
  async (
    req: Request<RedeemRewardParamsInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const redeemedReward = await redeemRewardService(req.user!.id, req.params);
    return ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'Reward redeemed successfully.',
      { data: redeemedReward },
    );
  },
);
