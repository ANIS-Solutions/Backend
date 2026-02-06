import AppError from '@core/utils/AppError';
import { catchAsync } from '@core/utils/catchAsync';
import HttpStatusCode from '@core/utils/HttpStatusCode';
import { ParentModel } from '@modules/auth/authModel';
import { verifyToken } from '@modules/auth/authService';
import { NextFunction, Request, Response } from 'express';

export const authMiddleware = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    const cookies = req.cookies as { refreshToken: string };
    if (!cookies) return next(new AppError('', HttpStatusCode.UNAUTHORIZED));
    const refreshDecoded = verifyToken(cookies.refreshToken);
    if (!refreshDecoded)
      return next(new AppError('', HttpStatusCode.UNAUTHORIZED));

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
    if (!stillUser.refreshToken) {
      return next(
        new AppError(
          'You are not logged in! log in firstly.',
          HttpStatusCode.UNAUTHORIZED,
        ),
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
    req.user = stillUser;
    // req.user = decoded;
    next();
  },
);
