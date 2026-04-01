import AppError from '@/core/utils/AppError';
import { HttpStatusCode } from '@anis/shared';
import { Types } from 'mongoose';

import { ChildModel, IChildren } from './child.model.js';
import {
  CreateChildBodyInput,
  IChild,
  UpdateChildBodyInput,
} from './child.schema.js';

export const addChildService = async (
  parentId: Types.ObjectId,
  addChildData: CreateChildBodyInput,
) => {
  if (!parentId) {
    throw new AppError('Parent not found', HttpStatusCode.UNAUTHORIZED);
  }

  const { firstName, gender, hobbies, dob } = addChildData;
  const child = await ChildModel.create({
    firstName,
    gender,
    hobbies: hobbies ?? [],
    dob,
    parent: parentId,
  });
  return child;
};

export const GetMyChildrenService = async (parentId: Types.ObjectId) => {
  const children = await ChildModel.find({ parent: parentId }).sort({
    createdAt: -1,
  });
  return children;
};

export const getMyChildService = async (
  parentId: Types.ObjectId,
  childId: string,
) => {
  const child = await ChildModel.findOne({
    _id: childId,
    parent: parentId,
  });

  if (!child) {
    throw new AppError('Child not found', HttpStatusCode.NOT_FOUND);
  }

  return child;
};
export const updateMyChild = async (
  parentId: Types.ObjectId,
  childId: string,
  updatedChildData: UpdateChildBodyInput,
) => {
  const updatedChild = await ChildModel.findByIdAndUpdate(
    {
      _id: childId,
      parent: parentId,
    },
    { $set: updatedChildData },
    {
      new: true,
      runValidators: true,
    },
  ).exec();

  if (!updatedChild) {
    throw new AppError('Child not found', HttpStatusCode.NOT_FOUND);
  }

  return updatedChild;
};
