import AppError from '@/core/utils/AppError';
import { catchAsync } from '@/core/utils/catchAsync';
import { ChildModel } from '@/modules/child/child.model';
import { HttpStatusCode, IJwtPayload } from '@anis/shared';
import { NextFunction, Request, Response } from 'express';

export const verifyChildOwnership = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user!;
    const { childId } = req.params;

    if (!childId) {
      return next(
        new AppError(
          'Child ID is required in the URL parameters.',
          HttpStatusCode.BAD_REQUEST,
        ),
      );
    }
    const isOwner = await ChildModel.exists({
      _id: childId,
      parentId: user.id,
    });

    if (!isOwner) {
      return next(
        new AppError(
          'Child not found or you do not have permission to access this child.',
          HttpStatusCode.NOT_FOUND,
        ),
      );
    }

    next();
  },
);
export const requireAnyChild = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user!;

    const hasChild = await ChildModel.exists({ parentId: user.id });

    if (!hasChild) {
      return next(
        new AppError(
          'You must pair at least one child device to your account to use this feature.',
          HttpStatusCode.FORBIDDEN,
        ),
      );
    }

    next();
  },
);
