import { getError } from '@controllers/errorController';
import AppError from '@utils/AppError';
import HttpStatusCode from '@utils/HttpStatusCode';
import logger from '@utils/logger';
import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export default (
  err: AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction,
): Response => {
  logger.warn(err);
  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return res.status(HttpStatusCode.BAD_REQUEST).json({
      status: 'fail',
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
