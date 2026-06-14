import config from '@/config/base';
import AppError from '@/core/utils/AppError';
import { HttpStatusCode } from '@anis/shared';

export interface MongoCastError extends Error {
  name: 'CastError';
  path: string;
  value: unknown;
}

export interface MongoDuplicateKeyError extends Error {
  code: number;
  keyValue: Record<string, unknown>;
}

export interface MongoValidationError extends Error {
  name: 'ValidationError';
  errors: Record<string, { message: string }>;
}

export interface JwtAuthError extends Error {
  name: 'JsonWebTokenError' | 'TokenExpiredError';
}

const safeErrParse = (err: unknown): Record<string, unknown> | null => {
  return typeof err === 'object' && err !== null
    ? (err as Record<string, unknown>)
    : null;
};

const isCastError = (err: unknown): err is MongoCastError =>
  safeErrParse(err)?.name === 'CastError';
const isDuplicateKeyError = (err: unknown): err is MongoDuplicateKeyError =>
  safeErrParse(err)?.code === 11000;
const isValidationError = (err: unknown): err is MongoValidationError =>
  safeErrParse(err)?.name === 'ValidationError';
const isJwtAuthError = (err: unknown): err is JwtAuthError =>
  safeErrParse(err)?.name === 'JsonWebTokenError' ||
  safeErrParse(err)?.name === 'TokenExpiredError';

const handleCastErrorDB = (err: MongoCastError): AppError => {
  const msg = `Invalid ${err.path}: ${String(err.value)}`;
  return new AppError(msg, HttpStatusCode.BAD_REQUEST);
};

const handleDuplicateFieldsDB = (err: MongoDuplicateKeyError): AppError => {
  const field = Object.keys(err.keyValue ?? {})[0];
  const value = Object.values(err.keyValue ?? {})[0];
  const message = `Duplicate field value: '${String(value)}'. Please use another ${field}!`;

  return new AppError(message, HttpStatusCode.BAD_REQUEST);
};

const handleValidationErrorDB = (err: MongoValidationError): AppError => {
  const errors = Object.values(err.errors ?? {}).map((el) =>
    el.message?.replaceAll('Path', '').replaceAll('.', ''),
  );
  const message = `Invalid input data. ${errors.join(', ')}`;
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

export const normalizeError = (err: unknown): AppError => {
  if (err instanceof AppError) {
    return err;
  }

  if (isCastError(err)) {
    return handleCastErrorDB(err);
  }

  if (isDuplicateKeyError(err)) {
    return handleDuplicateFieldsDB(err);
  }

  if (isValidationError(err)) {
    return handleValidationErrorDB(err);
  }

  if (isJwtAuthError(err)) {
    if (err.name === 'TokenExpiredError') {
      return handleJWTExpiredError();
    }
    return handleJWTError();
  }

  if (
    typeof err === 'object' &&
    (err as Error)?.message == 'App not found (404)'
  ) {
    return new AppError(
      `The app package could not be found on the Google Play Store. Please check the package name.`,
      HttpStatusCode.NOT_FOUND,
    );
  }

  const fallbackError = new AppError(
    'Internal Server Error',
    HttpStatusCode.INTERNAL_SERVER_ERROR,
    false,
  );

  if (!config?.IS_PROD_ENV) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    fallbackError.message = errorObj.message || fallbackError.message;
    if (errorObj.stack) fallbackError.stack = errorObj.stack;
  }

  return fallbackError;
};
