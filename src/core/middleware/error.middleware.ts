import { getError } from '@/core/handlers/error.handler';
import AppError from '@/core/utils/AppError';
import HttpStatusCode from '@/core/utils/HttpStatusCode';
import logger from '@/core/utils/logger';
import { NextFunction, Request, Response } from 'express';
import { success, ZodError } from 'zod';

export default (
  err: AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction,
): Response => {
  // logger.warn(err);
  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return res.status(HttpStatusCode.BAD_REQUEST).json({
      status: 'fail',
      success: false,
      message: 'Validation Error',
      errors,
    });
  }
  // if (err instanceof AppError) {
  //   return res.status(err.statusCode).json({
  //     status: err.status,
  //     message: err.message,
  //     stack: config.IS_DEV_ENV ? err.stack : undefined,
  //   });
  // }

  return getError(err, res)!;
};
