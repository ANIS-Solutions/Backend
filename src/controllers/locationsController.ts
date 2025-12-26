/* eslint-disable @typescript-eslint/no-empty-object-type */
import { locationModel } from '@models/locationsModel';
import { LocationsInput } from '@schemas/locationsSchema';
import { catchAsync } from '@utils/catchAsync';
import HttpStatusCode from '@utils/HttpStatusCode';
import { NextFunction, Request, Response } from 'express';

export const addLocation = catchAsync(
  async (
    req: Request<{}, {}, LocationsInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const data = req.body;
    const location = await locationModel.create({
      title: data.title,
      address: data.address,
    });
    return res.status(HttpStatusCode.CREATED).json({
      success: true,
      data: { location },
    });
  },
);
