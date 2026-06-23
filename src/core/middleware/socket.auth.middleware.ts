import { verifyToken } from '@/core/handlers/jwt.handler';
import type { TypedSocket } from '@/core/handlers/socket.handler';
import logger from '@/core/utils/logger';

import AppError from '../utils/AppError.js';
import { RoleValidators } from './auth.validation.middleware.js';

export const socketAuthMiddleware = async (
  socket: TypedSocket,
  next: (err?: Error) => void,
): Promise<void> => {
  try {
    const authHeader = socket.handshake.headers.authorization;

    const token: string | null =
      (socket.handshake.auth?.token as string) ??
      (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    const decoded = verifyToken(token);
    if (!decoded?.id || !decoded?.role) {
      return next(new Error('Authentication error: Invalid or expired token.'));
    }

    const validatorStrategy = RoleValidators[decoded.role];
    if (!validatorStrategy) {
      return next(
        new Error('Authentication error: Unsupported user role detected.'),
      );
    }

    const isActive = await validatorStrategy(decoded);

    socket.data.user = {
      id: decoded.id,
      role: decoded.role,
      isActive: isActive,
      iat: decoded.iat,
      exp: decoded.exp,
      ...(decoded.sub && { sub: decoded.sub }),
      ...(decoded.jti && { jti: decoded.jti }),
      ...(decoded.scopes && { scopes: decoded.scopes }),
      ...(decoded.deviceId && { deviceId: decoded.deviceId }),
    };
    logger.info(`Socket Authenticated ${decoded.role}: ${decoded.id}`);

    next();
  } catch (error: unknown) {
    if (error instanceof AppError) {
      const socketError = new Error(error.message);
      (socketError as Error & { data?: { statusCode: number } }).data = {
        statusCode: error.statusCode,
      };
      logger.error(`Socket Auth Failed (AppError): ${error.message}`);
      return next(socketError);
    }

    if (error instanceof Error) {
      logger.error(`Socket Auth Failed (Standard Error): ${error.message}`);
      return next(error);
    }

    logger.error('Socket Auth Failed with unknown exception');
    next(new Error('Authentication failed due to an unknown server error.'));
  }
};
