import { ILocationBase } from '@anis/shared';
import { Types } from 'mongoose';

import { ILocation } from './location.model.js';

type LeanLocation = Omit<ILocation, 'id'> &
  Required<{ _id: Types.ObjectId }> & { __v: number };

export const toLocationInfo = (
  loc: ILocation | LeanLocation,
): ILocationBase => {
  const safeId = (loc as ILocation).id || (loc as LeanLocation)._id.toString();
  const safeChildId =
    (loc as ILocation).childId.toString() ||
    (loc as LeanLocation).childId.toString();

  return {
    id: safeId,
    childId: safeChildId,
    title: loc.title,
    address: loc.address,
    location: loc.location,
    safeRadius: loc.safeRadius,
  };
};
