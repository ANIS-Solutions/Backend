import ApiResponse from '@/core/handlers/api.handler';
import { catchAsync } from '@/core/utils/catchAsync';
import { AddLocationsBodyInput } from '@/modules/locations/location.schema';
import { HttpStatusCode } from '@anis/shared';
import { NextFunction, Request, Response } from 'express';

import { addLocationService } from './location.services.js';

export const addLocation = catchAsync(
  async (
    req: Request<{}, {}, AddLocationsBodyInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const locData = await addLocationService(req.body);
    ApiResponse.success(
      res,
      HttpStatusCode.CREATED,
      'The new safe location is added successfully!',
      {
        data: locData,
      },
    );
  },
);
