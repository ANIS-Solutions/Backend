/* eslint-disable @typescript-eslint/no-empty-object-type */
import { IParent } from '@models/authModels';
import { ChildModel } from '@models/childrenModels';
import { CreateChildInput } from '@schemas/childrenSchema';
import { catchAsync } from '@utils/catchAsync';
import HttpStatusCode from '@utils/HttpStatusCode';
import { NextFunction, Request, Response } from 'express';

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

    if (!firstName || !lastName || gender === undefined || !dob) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: 'All fields are required',
      });
    }

    const child = await ChildModel.create({
      firstName,
      lastName,
      gender,
      // hobbies: hobbies || [],
      hobbies: hobbies ?? [],
      dob,
      parent: parentId,
    });

    const populatedChild = await ChildModel.findById(child._id).populate(
      'parent',
      'firstName lastName email',
    );

    return res.status(HttpStatusCode.CREATED).json({
      success: true,
      message: 'Child added successfully',
      data: {
        child: populatedChild,
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

    if (!parentId) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: 'Unauthorized: Parent not found',
      });
    }

    const children = await ChildModel.find({ parent: parentId })
      .populate('parent', 'firstName lastName email')
      .sort({ createdAt: -1 });

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
    req: Request,
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
    const childId = req.params.id;
    if (!childId) {
      throw new Error('Child ID is required');
    }
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
