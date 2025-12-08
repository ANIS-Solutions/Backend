import config from '@configs/base';
import AppError from '@utils/AppError';
import HttpStatusCode from '@utils/HttpStatusCode';
import logger from '@utils/logger';
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
    logger.error('Something wrong!!!!!!!!!');
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Something wrong!!!!!!!!!',
    });
  }
};

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any  */
const handleCastErrorDB = (err: any): AppError => {
  const msg = `Invalid ${err.path}: ${err.value}`;
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
  const message = `Duplicate field value: '${value}'. Please use another ${field}!`;

  return new AppError(message, HttpStatusCode.BAD_REQUEST);
};

const handleValidationErrorDB = (err: MongoError): AppError => {
  const errors = Object.values(err.errors ?? {}).map((el) =>
    el.message?.replaceAll('Path', '').replaceAll('.', ''),
  );
  const message = `Invalid input data.${errors.join(',')}`;
  return new AppError(message, HttpStatusCode.BAD_REQUEST);
};

const handleJWTError = (): AppError => {
  const message = `Invalid token, Please log in again!`;
  return new AppError(message, HttpStatusCode.UNAUTHORIZED);
};

const handleJWTExpiredError = (): AppError => {
  const message = `Token Expired, Please log in again!`;
  return new AppError(message, HttpStatusCode.UNAUTHORIZED);
};

const navigateErrors = (err: AppError): AppError => {
  let error = { ...err };
  if (err.name === 'CastError') error = handleCastErrorDB(error);
  if ((err as MongoError).code === 11000) error = handleDuplicateFieldsDB(err);
  if ((err as MongoError).name === 'ValidationError')
    error = handleValidationErrorDB(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
  return error;
};

export const getError = (
  err: AppError,
  res: Response,
): Response | undefined => {
  const statusCode = err.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;

  const message = err.message || 'Internal Server Error';
  err.statusCode = statusCode;
  err.message = message;
  if (config.IS_DEV_ENV) {
    const prodErr = navigateErrors(err);
    err.statusCode = prodErr.statusCode;
    return sendErrDEV(err, prodErr.message, res);
  } else if (config.IS_PROD_ENV) {
    const prodErr = navigateErrors(err);
    return sendErrProd(prodErr, res);
  }
};
