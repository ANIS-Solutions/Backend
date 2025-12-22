import { catchAsync } from '@utils/catchAsync';
import { NextFunction, Request, Response } from 'express';

export const CreateQuest = catchAsync(
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    res.send('Ok');
  },
);
