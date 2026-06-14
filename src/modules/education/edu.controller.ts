import ApiResponse from '@/core/handlers/api.handler';
import { catchAsync } from '@/core/utils/catchAsync';
import { HttpStatusCode } from '@anis/shared';
import { NextFunction, Request, Response } from 'express';

import { AddEduBodyInput } from './edu.schema.js';
import { addEduService } from './edu.services.js';

export const addEdu = catchAsync(
  async (
    req: Request<{}, {}, AddEduBodyInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const data = req.body;

    const eduData = await addEduService(data);
    ApiResponse.success(
      res,
      HttpStatusCode.CREATED,
      'Child Education added successfully',
      {
        data: eduData,
      },
    );
  },
);
