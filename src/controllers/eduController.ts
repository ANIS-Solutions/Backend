import { AddEduInput } from '@schemas/eduSchema';
import { addEduService } from '@services/eduServices';
import { catchAsync } from '@utils/catchAsync';
import HttpStatusCode from '@utils/HttpStatusCode';
import { NextFunction, Request, Response } from 'express';

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
