import { AppModel } from '@models/appModels';
import {
  AddAppInput,
  RemoveAppInput,
  SetLimitInput,
  ToggleBlockInput,
  UpdateAppInput,
} from '@schemas/appSchema';
import AppError from '@utils/AppError';
import { catchAsync } from '@utils/catchAsync';
import HttpStatusCode from '@utils/HttpStatusCode';
import { NextFunction, Request, Response } from 'express';

export const addApp = catchAsync(
  async (
    req: Request<{}, {}, AddAppInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> => {
    const { name, storeId, category, iconUrl, about, childId } = req.body;
    const existingApp = await AppModel.findOne({ child: childId, storeId });
    if (existingApp) {
      return next(
        new AppError(
          'App already exists for this child',
          HttpStatusCode.CONFLICT,
        ),
      );
    }
    const newApp = await AppModel.create({
      name,
      storeId,
      category,
      iconUrl,
      about,
      child: childId,
    });

    return res.status(HttpStatusCode.CREATED).json({
      success: true,
      message: 'app added successfully',
      data: {
        newApp,
      },
    });
  },
);
export const removeApp = catchAsync(
  async (
    req: Request<RemoveAppInput, {}, {}>,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> => {
    const { appId, childId } = req.params;
    const result = await AppModel.deleteOne({ _id: appId, child: childId });

    if (result.deletedCount === 0) {
      return next(new AppError('App not found', HttpStatusCode.NOT_FOUND));
    }
    return res.status(HttpStatusCode.OK).json({
      success: true,
      message: 'app removed successfully',
    });
  },
);
export const updateApp = catchAsync(
  async (
    req: Request<UpdateAppInput['params'], {}, UpdateAppInput['body']>,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> => {
    const updateData = req.body;
    const { appId, childId } = req.params;
    const currApp = await AppModel.findByIdAndUpdate(
      { _id: appId, child: childId },
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!currApp) {
      return next(new AppError('App not found', HttpStatusCode.NOT_FOUND));
    }
    return res.status(HttpStatusCode.OK).json({
      success: true,
      message: 'app updated successfully',
      data: {
        currApp,
      },
    });
  },
);
export const blockApp = catchAsync(
  async (
    req: Request<ToggleBlockInput['params'], {}, ToggleBlockInput['body']>,
    res: Response,
    next: NextFunction,
  ) => {
    const { appId, childId } = req.params;
    const { isBlocked } = req.body;

    const currApp = await AppModel.findOneAndUpdate(
      { _id: appId, child: childId },
      { $set: { 'settings.isBlocked': isBlocked } },
      { new: true },
    );

    if (!currApp) {
      return next(new AppError('App not found', HttpStatusCode.NOT_FOUND));
    }

    return res.status(HttpStatusCode.OK).json({
      success: true,
      message: `App ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      data: { settings: currApp.settings },
    });
  },
);
export const limitApp = catchAsync(
  async (
    req: Request<SetLimitInput['params'], {}, SetLimitInput['body']>,
    res: Response,
    next: NextFunction,
  ) => {
    const { appId, childId } = req.params;
    const { dailyLimit } = req.body;

    const currApp = await AppModel.findOneAndUpdate(
      { _id: appId, child: childId },
      { $set: { 'settings.dailyLimit': dailyLimit } },
      { new: true },
    );

    if (!currApp) {
      return next(new AppError('App not found', HttpStatusCode.NOT_FOUND));
    }

    return res.status(HttpStatusCode.OK).json({
      success: true,
      message: 'App limit updated successfully',
      data: { settings: currApp.settings },
    });
  },
);
