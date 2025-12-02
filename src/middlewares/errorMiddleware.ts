import { AppError } from '@utils/AppError';
import HttpStatusCode from '@utils/HttpStatusCode';
import { NextFunction, Request, Response } from 'express';

export const globalErrorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const statusCode =
    (err as AppError).statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    status: (err as AppError).status || 'error',
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
