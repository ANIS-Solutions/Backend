import { IChildBase } from '@anis/shared';
import { Types } from 'mongoose';

import { IChild } from './child.model.js';

type LeanChild = Omit<IChild, 'id'> &
  Required<{ _id: Types.ObjectId }> & { __v: number };

export const toChildProfile = (child: IChild | LeanChild): IChildBase => {
  const safeId = (child as IChild).id || (child as LeanChild)._id.toString();

  return {
    id: safeId,
    firstName: child.firstName,
    gender: child.gender,
    hobbies: child.hobbies,
    dob: child.dob,
    isActive: child.isActive,
    deviceId: child.deviceId,
    deviceName: child.deviceName,
  };
};
