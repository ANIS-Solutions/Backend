import config from '@configs/base';
import AppError from '@utils/AppError';
import HttpStatusCode from '@utils/HttpStatusCode';
import { Response } from 'express';

const sendErrDEV = (
  err: AppError,
  prodErr: string,
  res: Response,
): Response => {
  return res.status(err.statusCode).json({
    status: err.status || 'error',
    productionErrorMsg: prodErr,
    message: err.message,
    stack: err.stack,
  });
};
const sendErrProd = (err: AppError, res: Response): Response => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    /* eslint-disable no-console */
    console.error('Something wrong!!!!!!!!!');
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Something wrong!!!!!!!!!',
    });
  }
};
/* eslint-disable @typescript-eslint/no-unsafe-member-access  */
/* eslint-disable @typescript-eslint/no-explicit-any */
const handleCastErrorDB = (err: any): AppError => {
  const msg = `Invalid ${err.path}: ${err.value}`;
  /* eslint-enable */

  return new AppError(msg, HttpStatusCode.BAD_REQUEST);
};

interface MongoError extends Error {
  code?: number;
  keyValue?: Record<string, string>;
  errors?: Record<string, string>[];
}

const handleDuplicateFieldsDB = (err: MongoError): AppError => {
  const field = Object.keys(err.keyValue ?? {})[0];
  const value = Object.values(err.keyValue ?? {})[0];
  // console.log(Object.keys(err.keyValue ?? {}));
  // console.log(Object.values(err.keyValue ?? {}));
  const message = `Duplicate field value: '${value}'. Please use another ${field}!`;

  return new AppError(message, HttpStatusCode.BAD_REQUEST);
};
const handleValidationErrorDB = (err: MongoError): AppError => {
  const errors = Object.values(err.errors ?? {}).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(', ')}`;
  return new AppError(message, HttpStatusCode.BAD_REQUEST);
};
const navigateErrors = (err: AppError): AppError => {
  let error = { ...err };
  if (err.name === 'CastError') error = handleCastErrorDB(error);
  if ((err as MongoError).code === 11000) error = handleDuplicateFieldsDB(err);
  if ((err as MongoError).name === 'ValidationError')
    error = handleValidationErrorDB(err);

  return error;
};

export const getError = (err: AppError, res: Response): Response => {
  const statusCode = err.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
  // console.log('====================================\nerr.status');
  // console.log(err.statusCode);

  const message = err.message || 'Internal Server Error';
  err.statusCode = statusCode;
  err.message = message;
  if (config.IS_DEV_ENV) {
    const prodErr = navigateErrors(err);
    err.statusCode = prodErr.statusCode;
    // console.log('====================================\nerr.status');
    // console.log(err.statusCode);
    return sendErrDEV(err, prodErr.message, res);
  } else {
    const prodErr = navigateErrors(err);
    return sendErrProd(prodErr, res);
  }
};
