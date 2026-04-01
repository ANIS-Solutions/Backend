import ApiResponse from '@/core/handlers/api.handler';
import { catchAsync } from '@/core/utils/catchAsync';
import HttpStatusCode from '@/core/utils/HttpStatusCode';
import { NextFunction, Request, Response } from 'express';

import { AddQuestBodyInput } from './quest.schema.js';
import { addQuestService } from './quest.services.js';

export const AddQuest = catchAsync(
  async (
    req: Request<{}, {}, AddQuestBodyInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const questData = await addQuestService(req.user?._id, req.body);

    ApiResponse.success(
      res,
      HttpStatusCode.CREATED,
      'Quest created successfully',
      questData,
    );
  },
);
