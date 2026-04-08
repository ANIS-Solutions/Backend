import config from '@/config/base';
import ApiResponse from '@/core/handlers/api.handler';
import { catchAsync } from '@/core/utils/catchAsync';
import { HttpStatusCode } from '@anis/shared';
import { NextFunction, Request, Response } from 'express';

import {
  ForgetPasswordBodyInput,
  LoginBodyInput,
  OTPBodyInput,
  RegisterBodyInput,
  ResetPasswordBodyInput,
  ResetPasswordParamsInput,
  VerifyOTPBodyInput,
} from './auth.schema.js';
import {
  forgetPasswordService,
  generateOTPService,
  loginService,
  logoutService,
  refreshTokenService,
  registerService,
  resetPasswordService,
  verifyOTPService,
} from './auth.services.js';

/**
 * Parent Registration
 * @auth none
 * @route {POST} /auth/register
 * @bodyparam user data @RegisterBodyInput
 * @returns user, accessToken, refreshToken
 */

export const register = catchAsync(
  async (
    req: Request<{}, {}, RegisterBodyInput>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    const { newUser, accessToken, refreshToken } = await registerService(
      req.body,
    );
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.IS_PROD_ENV,
      sameSite: true,
      maxAge: 7 * 24 * 60 * 60_000,
    });
    ApiResponse.success(
      res,
      HttpStatusCode.CREATED,
      'User Registered successful',
      {
        data: { user: newUser },
        accessToken,
      },
    );
  },
);

/**
 * Parent Login
 * @auth none
 * @route {POST} /auth/login
 * @bodyparam user data @LoginBodyInput
 * @returns accessToken, refreshToken
 */

export const login = catchAsync(
  async (
    req: Request<{}, {}, LoginBodyInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const { accessToken, refreshToken } = await loginService(req.body);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.IS_PROD_ENV,
      sameSite: true,
      maxAge: 7 * 24 * 60 * 60_000,
    });
    ApiResponse.success(res, HttpStatusCode.OK, 'User Logged-in successful', {
      accessToken,
    });
  },
);

/**
 * Generate OTP
 * @auth none
 * @route {GET} /auth/otp
 * @bodyparam user data @OTPBodyInput
 * @returns otp
 */
export const generate_otp = catchAsync(
  async (
    req: Request<{}, {}, OTPBodyInput>,
    res: Response,
    next: NextFunction,
  ) => {
    await generateOTPService(req.body);
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'If an account exists for this email, an OTP has been sent',
    );
  },
);

/**
 * Verify OTP
 * @auth none
 * @route {POST} /auth/otp
 * @bodyparam otp info @VerifyOTPBodyInput
 * @returns access token
 */
export const verify_otp = catchAsync(
  async (
    req: Request<{}, {}, VerifyOTPBodyInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const otpRet = await verifyOTPService(req.body);
    ApiResponse.success(res, HttpStatusCode.OK, 'OTP verified successfully.', {
      ...(otpRet?.accessToken && { accessToken: otpRet?.accessToken }),
    });
  },
);

/**
 * Forget Password
 * @auth none
 * @route {POST} /auth/password/forget
 * @bodyparam 
       - email: string;
 * @returns none
 */
export const forget_password = catchAsync(
  async (
    req: Request<{}, {}, ForgetPasswordBodyInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const resetToken = await forgetPasswordService(
      req.body.email,
      req.protocol,
      req.host,
    );

    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'Reset token sent to email successfully!',
      {
        devInfo: { resetToken },
      },
    );
  },
);

/**
 * Reset Password
 * @auth none
 * @route {PATCH} /auth/password/reset/:token
 * @bodyparam
      - password: string;
      - confirmPassword: string;
  * @returns none
 */
export const reset_password = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.params as ResetPasswordParamsInput;
    const { password } = req.body as ResetPasswordBodyInput;
    const { accessToken } = await resetPasswordService(token, password);
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'Password reset successfully!',
      {
        accessToken,
      },
    );
  },
);

/**
 * Logout
 * @auth through access token and refresh token
 * @route {GET} /auth/logout
 * @bodyparam none
 * @returns none
 */
export const logout = catchAsync(
  async (req: Request<{}, {}, {}>, res: Response, next: NextFunction) => {
    await logoutService(req.cookies.refreshToken as string);
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: config.IS_PROD_ENV,
      sameSite: 'strict',
    });
    ApiResponse.success(res, HttpStatusCode.OK, 'Logged out successfully!');
  },
);

/**
 * Refresh Token
 * @auth through refresh token from cookies
 * @route {POST} /auth/refresh-token
 * @bodyparam user info @ForgetPasswordBodyInput
 * @returns none
 */
export const refresh_token = catchAsync(
  async (req: Request, res: Response, next) => {
    const refreshToken = req.cookies.refreshToken as string | undefined;
    // if (!cookies.refreshToken) return res.sendStatus(HttpStatusCode.NO_CONTENT);
    const { accessToken } = await refreshTokenService(refreshToken);
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'Token refreshed successfully!',
      {
        accessToken,
      },
    );
  },
);
