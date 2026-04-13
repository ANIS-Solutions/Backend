import AppError from '@/core/utils/AppError';
import logger from '@/core/utils/logger';
import { HttpStatusCode, ILocationBase } from '@anis/shared';
import mongoose from 'mongoose';

import { toLocationInfo } from './location.dto.js';
import { locationModel } from './location.model.js';
import {
  AddLocationBodyInput,
  AddLocationParamsInput,
  GetAllLocationParamsInput,
  GetAllLocationQueryInput,
  GetLocationParamsInput,
  RemoveLocationParamsInput,
  UpdateLocationBodyInput,
  UpdateLocationParamsInput,
} from './location.schema.js';
import { ensureNoOverlap } from './location.utils.js';

export const addLocationService = async (
  locParams: AddLocationParamsInput,
  locBody: AddLocationBodyInput,
): Promise<ILocationBase> => {
  await ensureNoOverlap(locParams.childId, locBody.location.coordinates);
  const location = await locationModel.create({
    childId: locParams.childId,
    title: locBody.title,
    address: locBody.address,
    location: locBody.location,
    safeRadius: locBody.safeRadius,
  });
  return toLocationInfo(location);
};

export const updateLocationService = async (
  locParams: UpdateLocationParamsInput,
  locBody: UpdateLocationBodyInput,
): Promise<ILocationBase> => {
  if (locBody.location?.coordinates) {
    logger.error(locParams);
    await ensureNoOverlap(
      locParams.childId,
      locBody.location.coordinates,
      locParams.locId,
    );
  }
  const location = await locationModel.findByIdAndUpdate(
    { _id: locParams.locId, childId: locParams.childId },
    {
      title: locBody.title,
      address: locBody.address,
      location: locBody.location,
      safeRadius: locBody.safeRadius,
    },
    {
      runValidators: true,
      new: true,
    },
  );
  if (!location) {
    throw new AppError(
      `location with id (${locParams.locId}), not found!`,
      HttpStatusCode.NOT_FOUND,
    );
  }
  return toLocationInfo(location);
};

export const removeLocationService = async (
  locParams: RemoveLocationParamsInput,
): Promise<void> => {
  const location = await locationModel.findByIdAndDelete({
    _id: locParams.locId,
    childId: locParams.childId,
  });
  if (!location) {
    throw new AppError(
      `location with id (${locParams.locId}), not found!`,
      HttpStatusCode.NOT_FOUND,
    );
  }
};
export const getLocationService = async (
  locParams: GetLocationParamsInput,
): Promise<ILocationBase> => {
  logger.error(locParams);
  const location = await locationModel
    .findOne({ _id: locParams.locId, childId: locParams.childId })
    .lean();
  if (!location) {
    throw new AppError(
      `location with id (${locParams.locId}), not found!`,
      HttpStatusCode.NOT_FOUND,
    );
  }
  return toLocationInfo(location);
};

export const getAllLocationService = async (
  locParams: GetAllLocationParamsInput,
  locQuery: GetAllLocationQueryInput,
): Promise<ILocationBase[]> => {
  const { coord } = locQuery;
  let locations;
  if (!coord) {
    locations = await locationModel
      .find({ childId: locParams.childId })
      .sort({ createdAt: 1 })
      .lean();
  } else {
    // locations = await locationModel.aggregate([
    //   {
    //     $geoNear: {
    //       near: { type: 'Point', coordinates: [coord.lng, coord.lat] },
    //       distanceField: 'distanceMeters',
    //       spherical: true,
    //       query: { childId: new mongoose.Types.ObjectId(locParams.childId) },
    //     },
    //   },
    // ]);
    locations = await locationModel
      .find({
        childId: locParams.childId,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [coord.lng, coord.lat] },
          },
        },
      })
      .lean();
  }
  if (!locations || locations.length === 0) {
    return [];
  }
  return locations.map(toLocationInfo);
};
