import ApiResponse from '@/core/handlers/api.handler';
import { catchAsync } from '@/core/utils/catchAsync';
import logger from '@/core/utils/logger';
import { SseUtils } from '@/core/utils/sse.utils';
import { HttpStatusCode } from '@anis/shared';
import { NextFunction, Request, Response } from 'express';

import {
  DeleteAllNotificationParamsInput,
  DeleteNotificationParamsInput,
  GetAllNotificationParamsInput,
  MarkAsReadNotificationParamsInput,
} from './notifications.schema.js';
import {
  deleteAllNotificationService,
  deleteNotificationService,
  getAllNotificationService,
  markAsReadNotificationService,
} from './notifications.services.js';

export const getAllNotification = catchAsync(
  async (
    req: Request<GetAllNotificationParamsInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const currNotification = await getAllNotificationService(
      req.user!.id,
      req.params,
    );
    ApiResponse.success(
      res,
      HttpStatusCode.CREATED,
      'All notifications is retrieved!',
      {
        data: currNotification,
      },
    );
  },
);

export const deleteNotification = catchAsync(
  async (
    req: Request<DeleteNotificationParamsInput, {}, {}, {}>,
    res: Response,
    next: NextFunction,
  ) => {
    await deleteNotificationService(req.params);
    ApiResponse.success(
      res,
      HttpStatusCode.CREATED,
      `Notification ${req.params.notificationId} is deleted!`,
    );
  },
);

export const deleteAllNotifications = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await deleteAllNotificationService(req.user!.id);
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      `Notifications for ${req.user!.parentId} is deleted!`,
    );
  },
);

export const markAsReadNotification = catchAsync(
  async (
    req: Request<MarkAsReadNotificationParamsInput>,
    res: Response,
    next: NextFunction,
  ) => {
    await markAsReadNotificationService(req.params);
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      `Notifications for ${req.params.notificationId} is marked as read!`,
    );
  },
);
