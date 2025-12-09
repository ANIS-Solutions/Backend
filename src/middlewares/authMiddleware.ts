import { ParentModel } from '@models/authModels';
import { verifyToken } from '@services/authService';
import AppError from '@utils/AppError';
import { catchAsync } from '@utils/catchAsync';
import HttpStatusCode from '@utils/HttpStatusCode';
import { NextFunction, Request, Response } from 'express';

export const authMiddleware = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return next(
        new AppError(
          'You are not logged in! log in firstly.',
          HttpStatusCode.UNAUTHORIZED,
        ),
      );
    }

    const decoded = verifyToken(token);

    const stillUser = await ParentModel.findById(decoded.userId);
    if (!stillUser || !stillUser.isActive) {
      return next(
        new AppError('The user no longer exists.', HttpStatusCode.UNAUTHORIZED),
      );
    }

    if (decoded.iat && !stillUser.changePasswordAfter(decoded.iat)) {
      return next(
        new AppError(
          'Token Expired, Please log in again!',
          HttpStatusCode.UNAUTHORIZED,
        ),
      );
    }

    req.user = decoded;
    next();
  },
);
