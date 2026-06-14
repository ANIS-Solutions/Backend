import { IParentBase } from '@anis/shared';
import { Types } from 'mongoose';

import { IParent } from './parent.model.js';

type LeanParent = Omit<IParent, 'id'> &
  Required<{ _id: Types.ObjectId }> & { __v: number };

export const toParentProfile = (parent: IParent | LeanParent): IParentBase => {
  const safeId =
    (parent as IParent).id || (parent as LeanParent)._id.toString();

  return {
    id: safeId,
    firstName: parent.firstName,
    lastName: parent.lastName,
    email: parent.email,
    phone: parent.phone,
    birthDate: parent.birthDate,
    isActive: parent.isActive,
  };
};
