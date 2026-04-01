import { verifyToken } from '@/core/handlers/jwt.handler';
import AppError from '@/core/utils/AppError';
import { catchAsync } from '@/core/utils/catchAsync';
import HttpStatusCode from '@/core/utils/HttpStatusCode';
import { ParentModel } from '@/modules/auth/auth.model';
import { NextFunction, Request, Response } from 'express';

export const authMiddleware = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!req?.cookies?.refreshToken)
      return next(
        new AppError('Missing Refresh token', HttpStatusCode.UNAUTHORIZED),
      );
    const refreshToken = req.cookies.refreshToken as string;
    const refreshDecoded = verifyToken(refreshToken);
    if (!refreshDecoded)
      return next(
        new AppError(
          '[HttpStatusCode.UNAUTHORIZED',
          HttpStatusCode.UNAUTHORIZED,
        ),
      );

    if (!token) {
      return next(
        new AppError(
          'You are not logged in! log in firstly.',
          HttpStatusCode.UNAUTHORIZED,
        ),
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(
        new AppError("The token isn't correct.", HttpStatusCode.UNAUTHORIZED), //todo: handle token timeout
      );
    }
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
