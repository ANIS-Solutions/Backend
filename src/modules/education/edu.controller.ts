import { catchAsync } from '@core/utils/catchAsync';
import HttpStatusCode from '@core/utils/HttpStatusCode';
import { NextFunction, Request, Response } from 'express';

import { AddEduInput } from './edu.schema.js';
import { addEduService } from './edu.service.js';

export const addEdu = catchAsync(
  async (
    req: Request<{}, {}, AddEduInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const data = req.body;

    const edu = await addEduService(data);

    return res.status(HttpStatusCode.CREATED).json({
      message: 'Child Education added successfully',
      success: true,
      data: { edu },
    });
  },
);
