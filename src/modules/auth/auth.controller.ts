import config from '@/config/base';
import ApiResponse from '@/core/handlers/api.handler';
import { catchAsync } from '@/core/utils/catchAsync';
import HttpStatusCode from '@/core/utils/HttpStatusCode';
import { NextFunction, Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';

import { IParent, ParentModel } from './auth.model.js';
import {
  ChangePasswordBodyInput,
  DeactivateAccountInput,
  ForgetPasswordBodyInput,
  LoginBodyInput,
  OTPBodyInput,
  ReactivatePasswordInput,
  RegisterBodyInput,
  ResetPasswordBodyInput,
  ResetPasswordParamsInput,
  UpdateProfileBodyInput,
  VerifyOTPBodyInput,
} from './auth.schema.js';
import {
  changePasswordService,
  deactivateAccountService,
  forgetPasswordService,
  generateOTPService,
  getMeService,
  loginService,
  logoutService,
  reactivateAccountService,
  refreshTokenService,
  registerService,
  resetPasswordService,
  updateProfileService,
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
      { user: newUser },
      undefined,
      accessToken,
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
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'User Logged-in successful',
      undefined,
      undefined,
      accessToken,
    );
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
    console.log('msg ---------------------------------0 \n');
    await generateOTPService(req.body);
    console.log('msg ---------------------------------2 \n');
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
    const { accessToken } = await verifyOTPService(req.body);
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'OTP verified successfully.',
      undefined,
      undefined,
      accessToken,
    );
  },
);

/**
 * Forget Password
 * @auth none
 * @route {POST} /auth/forget-password
 * @bodyparam user info @ForgetPasswordBodyInput
 * @returns none
 */
export const forget_password = catchAsync(
  async (
    req: Request<{}, {}, ForgetPasswordBodyInput>,
    res: Response,
    next: NextFunction,
  ) => {
    console.log(req.body.email, req.protocol, req.host);
    await forgetPasswordService(req.body.email, req.protocol, req.host); //get('host')

    console.log(req.body.email, req.protocol, req.host);
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'Reset token sent to email successfully!',
    );
  },
);

/**
 * Reset Password
 * @auth none
 * @route {PATCH} /auth/reset-password
 * @bodyparam none
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
      undefined,
      undefined,
      accessToken,
    );
  },
);

export const deactivate_account = catchAsync(
  async (
    req: Request<{}, {}, DeactivateAccountInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const { otp, reason } = req.body;
    const userId = (req.user as JwtPayload).userId;
    await deactivateAccountService(otp, reason, userId);
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'Account is deactivated successfully!',
    );
  },
);

export const reactivate_account = catchAsync(
  async (
    req: Request<{}, {}, ReactivatePasswordInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const email: string = req.body.email;
    await reactivateAccountService(email, req.protocol, req.host);
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'Reset token sent to email successfully!',
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
 * CHange Password
 * @auth through access token
 * @route {PATCH} /auth/change-password
 * @bodyparam info @ChangePasswordBodyInput
 * @returns none
 */
export const change_password = catchAsync(
  async (
    req: Request<{}, {}, ChangePasswordBodyInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const userId = (req.user as JwtPayload).userId!;

    await changePasswordService(req.body, userId);
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'password changed successfully!',
    );
  },
);

/**
 * Update Profile
 * @auth through access token
 * @route {PATCH} /auth/update-profile
 * @bodyparam user info @UpdateProfileBodyInput
 * @returns updated user data
 */
export const update_profile = catchAsync(
  async (
    req: Request<{}, {}, UpdateProfileBodyInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const { currUser } = await updateProfileService(
      req.body,
      (req.user as JwtPayload).userId,
    );
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'Profile updated successfully!',
      {
        updatedUser: currUser,
      },
    );
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
      undefined,
      undefined,
      accessToken,
    );
  },
);
/**
 * Get ME
 * @auth through access token
 * @route {GET} /auth/me
 * @returns current user
 */
export const get_me = catchAsync(async (req: Request, res: Response, next) => {
  const currUser = await getMeService(req.user as IParent);

  ApiResponse.success(
    res,
    HttpStatusCode.OK,
    'User profile from /me',
    currUser,
  );
});

export const testOperation = catchAsync(
  async (req, res, next): Promise<Response> => {
    try {
      const users = await ParentModel.find({});
      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: 'iam test operations',
        users,
      });
    } catch (err) {
      return res.status(HttpStatusCode.SERVICE_UNAVAILABLE).json({
        success: false,
        message: 'iam error from test operations',
        err,
      });
    }
  },
);
