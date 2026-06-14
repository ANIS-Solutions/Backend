import config from '@/config/base';
import ApiResponse from '@/core/handlers/api.handler';
import { normalizeError } from '@/core/handlers/error.handler';
import AppError from '@/core/utils/AppError';
import logger from '@/core/utils/logger';
import { HttpStatusCode } from '@anis/shared';
import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export default (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction,
): Response => {
  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return ApiResponse.fail(
      res,
      HttpStatusCode.BAD_REQUEST,
      'Validation Error',
      {
        errors,
        devInfo: {
          stack: err.stack,
          rawMessage: err.message,
        },
      },
    );
  }

  // >>> Handle (Mongo, JWT, etc.)
  const normalizedErr = normalizeError(err);

  const devInfo = {
    stack: normalizedErr.stack,
    rawMessage: normalizedErr.message,
    originalError: typeof err === 'object' && err !== null ? err.message : err,
  };

  if (normalizedErr.isOperational) {
    return ApiResponse.fail(
      res,
      normalizedErr.statusCode,
      normalizedErr.message,
      { devInfo },
    );
  }

  if (config.IS_PROD_ENV) {
    logger.error(`Critical Error: ${normalizedErr.message}`, { err });
  }

  return ApiResponse.error(
    res,
    normalizedErr.statusCode,
    config.IS_PROD_ENV ? 'Something went wrong' : normalizedErr.message,
    { devInfo },
  );
};
