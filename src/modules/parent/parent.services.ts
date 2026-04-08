import config from '@/config/base';
import { CacheService } from '@/core/cache/cache.service';
import { AppEvents, eventBus } from '@/core/events/eventBus';
import { signAccessToken, signRefreshToken } from '@/core/handlers/jwt.handler';
import AppError from '@/core/utils/AppError';
import { AuthUtils } from '@/core/utils/auth.utils';
import logger from '@/core/utils/logger';
import {
  API,
  createPath,
  emailReasons,
  HttpStatusCode,
  IParentBase,
} from '@anis/shared';

import { toParentProfile } from './parent.dto.js';
import { ParentModel } from './parent.model.js';
import {
  ChangePasswordBodyInput,
  UpdateProfileBodyInput,
} from './parent.schema.js';

export const deactivateAccountService = async (
  otp: string,
  userId: string,
): Promise<void> => {
  const currUser = await ParentModel.findById(userId);
  if (!currUser || !currUser.isActive) {
    throw new AppError('Email already inactive.', HttpStatusCode.UNAUTHORIZED);
  }
  const candidateHashOTP = await CacheService.get(
    `otp:${emailReasons.DEACTIVATE}:${currUser.email}`,
  );

  if (
    !candidateHashOTP ||
    !(await AuthUtils.verifyOTP(otp, candidateHashOTP))
  ) {
    throw new AppError(
      'OTP is invalid or expired.',
      HttpStatusCode.BAD_REQUEST,
    );
  }
  currUser.isActive = false;
  await currUser.save({ validateBeforeSave: false });
};
export const reactivateAccountRequestService = async (
  email: string,
  protocol: string,
  host: string,
): Promise<{ reactivateToken: string }> => {
  const currUser = await ParentModel.findOne({ email });
  if (!currUser) {
    throw new AppError('User not found!', HttpStatusCode.NOT_FOUND);
  }
  const { token, hashedToken } = AuthUtils.generateCryptoToken();
  await CacheService.setWithTTL(
    `token:${emailReasons.REACTIVATE}:${hashedToken}`,
    currUser.id,
    config.TOKEN_EXPIRES * 60,
  );
  const reactivateURL =
    config.BASE_URL +
    createPath(
      {
        path: `${API.PARENT.PREFIX}${API.PARENT.ROUTES.REACTIVATE.path}` as const,
      },
      { token: token },
    );
  logger.warn(reactivateURL);

  eventBus.emit(AppEvents.SEND_EMAIL, {
    type: emailReasons.REACTIVATE,
    to: currUser.email,
    data: {
      name: currUser.firstName,
      url: reactivateURL,
      expiry_minutes: `${config.TOKEN_EXPIRES}`,
    },
  });
  return { reactivateToken: token };
};
export const reactivateAccountService = async (
  token: string,
): Promise<{
  accessToken: string;
  refreshToken: string;
}> => {
  const hashToken = AuthUtils.hashCryptoToken(token);
  const userId = await CacheService.get(
    `token:${emailReasons.REACTIVATE}:${hashToken}`,
  );
  const currUser = await ParentModel.findById(userId);
  if (!currUser) {
    throw new AppError('Account not found.', HttpStatusCode.NOT_FOUND);
  }
  if (currUser.isActive) {
    throw new AppError(
      'Account is already active.',
      HttpStatusCode.BAD_REQUEST,
    );
  }
  const accessToken = signAccessToken({ userId: currUser.id });
  const refreshToken = signRefreshToken({ userId: currUser.id });
  currUser.isActive = true;
  currUser.refreshToken = refreshToken;
  await currUser.save({ validateBeforeSave: false });
  return {
    accessToken,
    refreshToken,
  };
};
export const updateProfileService = async (
  updatedData: UpdateProfileBodyInput,
  userId: string,
): Promise<{ currUser: IParentBase }> => {
  const currUser = await ParentModel.findById(userId);
  if (!currUser) {
    throw new AppError('User not found!', HttpStatusCode.BAD_REQUEST);
  }

  Object.assign(currUser, updatedData);
  await currUser.save();
  return { currUser: toParentProfile(currUser) };
};

export const changePasswordService = async (
  reqBody: ChangePasswordBodyInput,
  userId: string,
): Promise<void> => {
  const { oldPassword, password } = reqBody;

  const currUser = await ParentModel.findById(userId).select('+password');

  if (
    !currUser ||
    !(await AuthUtils.verifyPassword(oldPassword, currUser.password))
  ) {
    throw new AppError('Password changed failed.', HttpStatusCode.UNAUTHORIZED);
  }
  currUser.password = await AuthUtils.hashPassword(password);
  currUser.passwordChangedAt = new Date();
  currUser.refreshToken = undefined;
  await currUser.save();
};

export const getMeService = async (userId: string): Promise<IParentBase> => {
  const currUser = await ParentModel.findById(userId).lean();
  if (!currUser)
    throw new AppError('No current user', HttpStatusCode.NOT_FOUND);
  return toParentProfile(currUser);
};
