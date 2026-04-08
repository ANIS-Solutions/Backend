import { verifyToken } from '@/core/handlers/jwt.handler';
import AppError from '@/core/utils/AppError';
import { catchAsync } from '@/core/utils/catchAsync';
import { ParentModel } from '@/modules/parent/parent.model';
import { HttpStatusCode } from '@anis/shared';
import { NextFunction, Request, Response } from 'express';

import { AuthUtils } from '../utils/auth.utils.js';
import logger from '../utils/logger.js';

export const authMiddleware = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // if (!req?.cookies?.refreshToken)
    //   return next(
    //     new AppError('Missing Refresh token', HttpStatusCode.UNAUTHORIZED),
    //   );
    // const refreshToken = req.cookies.refreshToken as string;
    // const refreshDecoded = verifyToken(refreshToken);
    // if (!refreshDecoded)
    //   return next(
    //     new AppError(
    //       '[HttpStatusCode.UNAUTHORIZED',
    //       HttpStatusCode.UNAUTHORIZED,
    //     ),
    //   );
    if (!token) {
      return next(
        new AppError(
          'You are not logged in! Please log in to get access.',
          HttpStatusCode.UNAUTHORIZED,
        ),
      );
    }

    const decoded = verifyToken(token);
    logger.warn(token);
    logger.warn(decoded);
    if (!decoded?.userId) {
      return next(
        new AppError('Invalid or expired token.', HttpStatusCode.UNAUTHORIZED),
      );
    }

    const stillUser = await ParentModel.findById(decoded.userId);

    if (!stillUser || !stillUser.isActive) {
      return next(
        new AppError(
          'The user belonging to this token no longer exists.',
          HttpStatusCode.UNAUTHORIZED,
        ),
      );
    }

    if (!stillUser.refreshToken) {
      return next(
        new AppError(
          'Session expired. Please log in again.',
          HttpStatusCode.UNAUTHORIZED,
        ),
      );
    }
    if (
      decoded.iat &&
      AuthUtils.isPasswordChangedAfterAccessTokenIAT(
        stillUser.createdAt,
        stillUser.passwordChangedAt,
        decoded.iat,
      )
    ) {
      return next(
        new AppError(
          'User recently changed password! Please log in again.',
          HttpStatusCode.UNAUTHORIZED,
        ),
      );
    }

    req.user = {
      id: stillUser.id,
      email: stillUser.email,
      isActive: stillUser.isActive,
      role: 'PARENT',
    };
    next();
  },
);
