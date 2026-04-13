import config from '@/config/base';
import ApiResponse from '@/core/handlers/api.handler';
import { catchAsync } from '@/core/utils/catchAsync';
import { HttpStatusCode } from '@anis/shared';
import { NextFunction, Request, Response } from 'express';

import {
  ChangePasswordBodyInput,
  DeactivateAccountInput,
  ReactivateAccountInput,
  ReactivateAccountRequestInput,
  UpdateProfileBodyInput,
} from './parent.schema.js';
import {
  changePasswordService,
  deactivateAccountService,
  getMeService,
  reactivateAccountRequestService,
  reactivateAccountService,
  updateProfileService,
} from './parent.services.js';

/**
 * Parent Registration
 * @auth none
 * @route {POST} /auth/register
 * @bodyparam user data @RegisterBodyInput
 * @returns user, accessToken, refreshToken
 */

export const deactivate_account = catchAsync(
  async (
    req: Request<{}, {}, DeactivateAccountInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const { otp, reason } = req.body;
    const userId = req.user!.id;
    await deactivateAccountService(otp, userId);
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'Account is deactivated successfully!',
    );
  },
);

export const reactivate_account_request = catchAsync(
  async (
    req: Request<{}, {}, ReactivateAccountRequestInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const email: string = req.body.email;
    const { reactivateToken } = await reactivateAccountRequestService(
      email,
      req.protocol,
      req.host,
    );
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'Reset token sent to email successfully!',
      {
        devInfo: {
          reactivateToken,
        },
      },
    );
  },
);
export const reactivate_account = catchAsync(
  async (
    req: Request<ReactivateAccountInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const token = req.params.token;
    const { accessToken, refreshToken } = await reactivateAccountService(token);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.IS_PROD_ENV,
      sameSite: true,
      maxAge: 7 * 24 * 60 * 60_000,
    });

    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'Account reactivated successfully!',
      { accessToken },
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
    const { currUser } = await updateProfileService(req.body, req.user!.id);
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'Profile updated successfully!',
      {
        data: { updatedUser: currUser },
      },
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
  const currUser = await getMeService(req.user!.id);

  ApiResponse.success(res, HttpStatusCode.OK, 'User profile from /me', {
    data: currUser,
  });
});
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
    const userId = req.user!.id;

    await changePasswordService(req.body, userId);
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'password changed successfully!',
    );
  },
);
