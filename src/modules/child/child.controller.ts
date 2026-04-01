import ApiResponse from '@/core/handlers/api.handler';
import { catchAsync } from '@/core/utils/catchAsync';
import HttpStatusCode from '@/core/utils/HttpStatusCode';
import { NextFunction, Request, Response } from 'express';

import { IParent } from '../auth/auth.model.js';
import {
  CreateChildBodyInput,
  GetSingleChildParamsInput,
  UpdateChildBodyInput,
  UpdateChildParamsInput,
} from './child.schema.js';
import {
  addChildService,
  GetMyChildrenService,
  getMyChildService,
  updateMyChild,
} from './child.services.js';

//=============== Add Children =====================//
export const add_children = catchAsync(
  async (
    req: Request<{}, {}, CreateChildBodyInput>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    const parentId = (req.user as IParent)._id;

    const childData = await addChildService(parentId, req.body);
    ApiResponse.success(
      res,
      HttpStatusCode.CREATED,
      'Child added successfully!',
      childData,
    );
  },
);

//=============== Get All Children =====================//
export const get_all_children = catchAsync(
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    const parentId = (req.user as IParent)._id;
    const childrenData = await GetMyChildrenService(parentId);
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'The children data',
      childrenData,
    );
  },
);

//=============== Get Single Children =====================//
export const get_single_children = catchAsync(
  async (
    req: Request<GetSingleChildParamsInput>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    const parentId = (req.user as IParent)._id;
    const childId = req.params.childId;
    const childData = await getMyChildService(parentId, childId);
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'The child data is retrieved successfully',
      childData,
    );
  },
);

export const update_my_child = catchAsync(
  async (
    req: Request<UpdateChildParamsInput, {}, UpdateChildBodyInput>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    const parentId = (req.user as IParent)._id;
    const childId = req.params.childId;
    const newChildFields = req.body;
    const updatedChildData = await updateMyChild(
      parentId,
      childId,
      newChildFields,
    );
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'The child data is updated successfully',
      updatedChildData,
    );
  },
);
