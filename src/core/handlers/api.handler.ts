import config from '@/config/base';
import { IApiResponse, IFieldError, IMeta } from '@/types/response.types';
import { HttpStatusCode } from '@anis/shared';
import { Response } from 'express';

interface SuccessOptions<T> {
  data?: T;
  meta?: IMeta;
  accessToken?: string;
  devInfo?: Record<string, unknown>;
}

interface FailOptions {
  errors?: IFieldError[];
  devInfo?: Record<string, unknown>;
}

interface ErrorOptions {
  devInfo?: Record<string, unknown>;
}

class ApiResponse {
  /**
   * Send a successful JSON response.
   *
   * @example
   * ApiResponse.success(res, HttpStatusCode.OK, 'User created', {
   *   data: user,
   *   devInfo: { resetToken, note: 'only visible in dev' },
   * });
   */
  static success<T>(
    res: Response,
    statusCode: HttpStatusCode,
    message: string,
    options: SuccessOptions<T> = {},
  ): Response<IApiResponse<T>> {
    const { data, meta, accessToken, devInfo } = options;

    const payload: IApiResponse<T> = {
      success: true,
      status: 'success',
      message,
    };

    // >>> keeps responses lean
    if (data !== undefined) payload.data = data;
    if (meta !== undefined) payload.meta = meta;
    if (accessToken !== undefined) payload.accessToken = accessToken;

    if (devInfo && !config.IS_PROD_ENV) {
      payload.devInfo = devInfo;
    }

    return res.status(statusCode).json(payload) as Response<IApiResponse<T>>;
  }

  /**
   * 4xx client error - the request was invalid.
   *
   * @example
   * ApiResponse.fail(res, HttpStatusCode.BAD_REQUEST, 'Validation Error', {
   *   errors: [{ field: 'email', message: 'Invalid email' }],
   * });
   */
  static fail(
    res: Response,
    statusCode: HttpStatusCode,
    message: string,
    options: FailOptions = {},
  ): Response<IApiResponse<null>> {
    const { errors, devInfo } = options;

    const payload: IApiResponse<null> = {
      success: false,
      status: 'fail',
      message,
    };

    if (errors !== undefined) payload.errors = errors;

    if (devInfo && !config.IS_PROD_ENV) {
      payload.devInfo = devInfo;
    }

    return res.status(statusCode).json(payload) as Response<IApiResponse<null>>;
  }

  /**
   * 5xx server error - something broke on our side.
   *
   * @example
   * ApiResponse.error(res, HttpStatusCode.INTERNAL_SERVER_ERROR, 'Something went wrong');
   */
  static error(
    res: Response,
    statusCode: HttpStatusCode,
    message: string,
    options: ErrorOptions = {},
  ): Response<IApiResponse<null>> {
    const { devInfo } = options;

    const payload: IApiResponse<null> = {
      success: false,
      status: 'error',
      message,
    };

    if (devInfo && !config.IS_PROD_ENV) {
      payload.devInfo = devInfo;
    }

    return res.status(statusCode).json(payload) as Response<IApiResponse<null>>;
  }

  private constructor() {
    // prevent instantiation
  }
}

export default ApiResponse;
