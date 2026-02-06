import { catchAsync } from '@core/utils/catchAsync';
import HttpStatusCode from '@core/utils/HttpStatusCode';
import { NextFunction, Request, Response } from 'express';

import { IParent } from '../auth/authModel.js';
import { ChildModel } from './childrenModel.js';
import { CreateChildInput, GetSingleChildInput } from './childrenSchema.js';

//=============== Add Children =====================//
export const add_children = catchAsync(
  async (
    req: Request<{}, {}, CreateChildInput>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    const parentId = (req.user as IParent)._id;

    if (!parentId) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: 'Unauthorized: Parent not found',
      });
    }

    const { firstName, lastName, gender, hobbies, dob } = req.body;
    // // REVIEW: `authValidate(createChildSchema)` crying at the corner
    // if (!firstName || !lastName || !gender === undefined || !dob) {
    //   return res.status(HttpStatusCode.BAD_REQUEST).json({
    //     success: false,
    //     message: 'All fields are required',
    //   });
    // }
    const child = await ChildModel.create({
      firstName,
      lastName,
      gender,
      // hobbies: hobbies || [],
      hobbies: hobbies ?? [],
      dob,
      parent: parentId,
    });
    // // FIXME: Too much queries? parent infos can known from previous query.
    // const populatedChild = await ChildModel.findById(child._id).populate(
    //   'parent',
    //   'firstName lastName email',
    // );

    return res.status(HttpStatusCode.CREATED).json({
      success: true,
      message: 'Child added successfully',
      data: {
        child,
      },
    });
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

    // // REVIEW: authMiddleware handle it!
    // if (!parentId) {
    //   return res.status(HttpStatusCode.UNAUTHORIZED).json({
    //     success: false,
    //     message: 'Unauthorized: Parent not found',
    //   });
    // }
    // // REVIEW: now parent get his children, why i return his information?
    const children = await ChildModel.find({ parent: parentId }).sort({
      createdAt: -1,
    });

    return res.status(HttpStatusCode.OK).json({
      success: true,
      results: children.length,
      data: {
        children,
      },
    });
  },
);

//=============== Get Single Children =====================//
export const get_single_children = catchAsync(
  async (
    req: Request<GetSingleChildInput>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    const parentId = (req.user as IParent)._id;
    // // REVIEW: authMiddleware handle it!
    // if (!parentId) {
    //   return res.status(HttpStatusCode.UNAUTHORIZED).json({
    //     success: false,
    //     message: 'Unauthorized: Parent not found',
    //   });
    // }
    const childId = req.params.childId;
    // // REVIEW: can handle in schema??
    // if (!childId) {
    //   // REVIEW: should use our custom AppError throw error middleware
    //   return next(new AppError('Child ID is required', 500));
    // }
    // REVIEW: now parent get his children, why i return his information?
    const child = await ChildModel.findOne({
      _id: childId,
      // userId: childId,
      parent: parentId,
    }).populate('parent', 'firstName lastName email');

    if (!child) {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        success: false,
        message: 'Child not found',
      });
    }
    return res.status(HttpStatusCode.OK).json({
      success: true,
      data: {
        child,
      },
    });
  },
);

//=============== Get Single Children =====================//
