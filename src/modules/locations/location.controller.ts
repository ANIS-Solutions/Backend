import ApiResponse from '@/core/handlers/api.handler';
import { catchAsync } from '@/core/utils/catchAsync';
import HttpStatusCode from '@/core/utils/HttpStatusCode';
import { AddLocationsBodyInput } from '@/modules/locations/location.schema';
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
      locData,
    );
  },
);
