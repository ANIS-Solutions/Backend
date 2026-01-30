import { App } from '@models/App/appModel';
import { AppPolicy } from '@models/App/appPolicyModel';
// import { AppUsage } from '@models/App/appUsageModel';
import {
  blockAppInput,
  GetAllAppsInput,
  getSingleAppInput,
  unBlockAppInput,
} from '@schemas/appSchema';
import AppError from '@utils/AppError';
import { catchAsync } from '@utils/catchAsync';
import HttpStatusCode from '@utils/HttpStatusCode';
import { NextFunction, Request, Response } from 'express';

export const getAllApps = catchAsync(
  async (req: Request<GetAllAppsInput>, res: Response, next: NextFunction) => {
    const { childId } = req.params;
    const apps = await App.find({ child: childId });
    if (!apps) {
      return next(new AppError('No Apps Found .', HttpStatusCode.NOT_FOUND));
    }
    return res.status(HttpStatusCode.FOUND).json({
      success: true,
      data: apps,
    });
  },
);
export const getSingleApp = catchAsync(
  async (
    req: Request<getSingleAppInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const { childId, appId } = req.params;
    const app = await App.findOne({ _id: appId, child: childId });

    if (!app) {
      return next(new AppError('App Not Found', HttpStatusCode.NOT_FOUND));
    }

    return res.status(HttpStatusCode.FOUND).json({
      success: true,
      data: app,
    });
  },
);
export const blockApp = catchAsync(
  async (req: Request<blockAppInput>, res: Response, next: NextFunction) => {
    const { childId, appId } = req.params;

    let policy = await AppPolicy.findOne({ child: childId, app: appId });
    //First block
    if (!policy) {
      policy = await AppPolicy.create({
        child: childId,
        app: appId,
        isBlocked: true,
      });
    } else {
      policy.isBlocked = true;
      await policy.save();
    }
    return res.status(HttpStatusCode.CREATED).json({
      success: true,
      data: policy,
    });
  },
);
export const unblockApp = catchAsync(
  async (req: Request<unBlockAppInput>, res: Response, next: NextFunction) => {
    const { childId, appId } = req.params;

    const policy = await AppPolicy.findOne({ child: childId, app: appId });

    if (policy) {
      policy.isBlocked = false;
      await policy.save();
    } else {
      return next(new AppError('No app blocked ', HttpStatusCode.NOT_FOUND));
    }
  },
);
