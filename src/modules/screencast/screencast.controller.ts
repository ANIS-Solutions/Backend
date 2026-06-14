import ApiResponse from '@/core/handlers/api.handler';
import { catchAsync } from '@/core/utils/catchAsync';
import { HttpStatusCode } from '@anis/shared';
import { Request, Response } from 'express';

import { screenCastRequestInput } from './screencast.schema.js';
import { requestScreenCastService } from './screencast.services.js';

export const requestScreenCast = catchAsync(
  async (req: Request<screenCastRequestInput>, res: Response) => {
    const parentId = req.user!.id;

    await requestScreenCastService(req.params, parentId);
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'Screen share requested. Waiting for device connection...',
    );
  },
);
