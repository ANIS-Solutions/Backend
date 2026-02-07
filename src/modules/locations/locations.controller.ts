import { catchAsync } from '@core/utils/catchAsync';
import HttpStatusCode from '@core/utils/HttpStatusCode';
import { locationModel } from '@modules/locations/locations.model';
import { LocationsInput } from '@modules/locations/locations.schema';
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
