import AppError from '@/core/utils/AppError';
import logger from '@/core/utils/logger';
import { HttpStatusCode } from '@anis/shared';
import mongoose, { QueryFilter } from 'mongoose';

import { ILocation, locationModel } from './location.model.js';

export const ensureNoOverlap = async (
  childId: string,
  coordinates: number[],
  excludeLocationId?: string,
): Promise<void> => {
  const MIN_DISTANCE_METERS = 50;

  const query: QueryFilter<ILocation> = {
    childId,
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates },
        $maxDistance: MIN_DISTANCE_METERS,
      },
    },
  };
  logger.error(excludeLocationId);
  if (excludeLocationId) {
    query._id = { $ne: excludeLocationId };
  }

  const overlappingZone = await locationModel.findOne(query).lean();

  if (overlappingZone) {
    throw new AppError(
      `This location is too close (within ${MIN_DISTANCE_METERS}m) to an existing safe zone: '${overlappingZone.title}'.`,
      HttpStatusCode.BAD_REQUEST,
    );
  }
};
