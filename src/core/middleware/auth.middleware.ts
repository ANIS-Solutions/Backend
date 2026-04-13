import { verifyToken } from '@/core/handlers/jwt.handler';
import AppError from '@/core/utils/AppError';
import { catchAsync } from '@/core/utils/catchAsync';
import logger from '@/core/utils/logger';
import { HttpStatusCode, IJwtPayload } from '@anis/shared';
import { NextFunction, Request, Response } from 'express';

import { RoleValidators } from './auth.validation.middleware.js';

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
    if (!decoded?.id || !decoded?.role) {
      return next(
        new AppError('Invalid or expired token.', HttpStatusCode.UNAUTHORIZED),
      );
    }

    const validatorStrategy = RoleValidators[decoded.role];

    if (!validatorStrategy) {
      return next(
        new AppError(
          'Unsupported user role detected.',
          HttpStatusCode.FORBIDDEN,
        ),
      );
    }

    const isActive = await validatorStrategy(decoded);

    const userPayload: IJwtPayload = {
      id: decoded.id,
      role: decoded.role,
      isActive: isActive,
      iat: decoded.iat,
      exp: decoded.exp,
    };
    if (decoded.sub) userPayload.sub = decoded.sub;
    if (decoded.jti) userPayload.jti = decoded.jti;
    if (decoded.scopes) userPayload.scopes = decoded.scopes;
    if (decoded.deviceId) userPayload.deviceId = decoded.deviceId;
    req.user = userPayload;

    logger.info(`Authenticated ${decoded.role}: ${decoded.id}`);
    next();
  },
);
