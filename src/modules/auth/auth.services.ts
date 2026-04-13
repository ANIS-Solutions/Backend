import config from '@/config/base';
import { CacheService } from '@/core/cache/cache.service';
import { AppEvents, eventBus } from '@/core/events/eventBus';
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from '@/core/handlers/jwt.handler';
import AppError from '@/core/utils/AppError';
import { AuthUtils } from '@/core/utils/auth.utils';
import logger from '@/core/utils/logger';
import { IParent, ParentModel } from '@/modules/parent/parent.model';
import {
  API,
  createPath,
  emailReasons,
  HttpStatusCode,
  UserRoles,
} from '@anis/shared';
import { JwtPayload } from 'jsonwebtoken';

import {
  LoginBodyInput,
  OTPBodyInput,
  RegisterBodyInput,
  VerifyOTPBodyInput,
} from './auth.schema.js';

const genAccessToken = (user: IParent): string => {
  return signAccessToken({
    id: user.id,
    role: UserRoles.PARENT,
  });
};
const genRefreshToken = (user: IParent): string => {
  return signRefreshToken({
    id: user.id,
    role: UserRoles.PARENT,
  });
};
export const registerService = async (
  registerData: RegisterBodyInput,
): Promise<{ newUser: IParent; accessToken: string; refreshToken: string }> => {
  const { email, password, phone, firstName, lastName, birthDate } =
    registerData;
  const existing = await ParentModel.findOne({ $or: [{ email }, { phone }] });
  if (existing) {
    if (!existing.isActive) {
      throw new AppError(
        'This account is deactivated.',
        HttpStatusCode.BAD_REQUEST,
      );
    }
    const field =
      existing.email === email && existing.phone === phone
        ? 'Email or Phone'
        : existing.email === email
          ? 'Email'
          : 'Phone number';
    throw new AppError(`${field} already exists.`, HttpStatusCode.CONFLICT);
  }
  const hashPassword = await AuthUtils.hashPassword(password);
  const newUser = await ParentModel.create({
    email,
    password: hashPassword,
    phone,
    firstName,
    lastName,
    birthDate,
  });
  const accessToken = genAccessToken(newUser);
  // logger.warn(newUser.id);
  // logger.warn(accessToken);

  const refreshToken = genRefreshToken(newUser);

  newUser.refreshToken = refreshToken;
  await newUser.save({ validateBeforeSave: false });
  return {
    newUser,
    accessToken,
    refreshToken,
  };
};

export const loginService = async (
  loginData: LoginBodyInput,
): Promise<{ accessToken: string; refreshToken: string }> => {
  const { email, password } = loginData;
  const currUser = await ParentModel.findOne({ email }).select('+password');
  if (
    !currUser ||
    !(await AuthUtils.verifyPassword(password, currUser.password))
  ) {
    throw new AppError(
      'Please provide correct email and password.',
      HttpStatusCode.UNAUTHORIZED,
    );
  }
  if (!currUser.isActive) {
    throw new AppError(
      'This account is deactivated, to reactivate it, POST /auth/reactivate .',
      HttpStatusCode.BAD_REQUEST,
    );
  }
  const accessToken = genAccessToken(currUser);
  const refreshToken = genRefreshToken(currUser);

  currUser.refreshToken = refreshToken;
  await currUser.save({ validateBeforeSave: false });
  return {
    accessToken,
    refreshToken,
  };
};

export const generateOTPService = async (
  genOtpData: OTPBodyInput,
): Promise<void> => {
  const { email, reason } = genOtpData;
  const currUser = await ParentModel.findOne({ email }).select('+otp');
  if (!currUser) return;

  const { otp, hashOtp } = await AuthUtils.generateOTP();
  await CacheService.setWithTTL(
    `otp:${emailReasons[reason]}:${email}`,
    hashOtp,
    config.OTP_EXPIRES_IN * 60,
  );

  eventBus.emit(AppEvents.SEND_EMAIL, {
    type: emailReasons.VERIFY_OTP,
    to: currUser.email,
    data: {
      name: currUser.firstName,
      otp,
      expiry_minutes: `${config.OTP_EXPIRES_IN}`,
      expiry_time: `${(Date.now() + config.OTP_EXPIRES_IN).toLocaleString()}`,
    },
  });
};
export const verifyOTPService = async (
  verifyOtpData: VerifyOTPBodyInput,
): Promise<{ accessToken: string } | null> => {
  const { email, otp, reason } = verifyOtpData;
  const currUser = await ParentModel.findOne({ email });
  if (!currUser || !currUser.isActive) {
    throw new AppError(
      `Your account email is inactive.`,
      HttpStatusCode.FORBIDDEN,
    );
  }
  const hashOtp = await CacheService.get(`otp:${reason}:${email}`);
  if (!hashOtp || !(await AuthUtils.verifyOTP(otp, hashOtp))) {
    throw new AppError(
      `OTP is invalid or expired.`,
      HttpStatusCode.BAD_REQUEST,
    );
  }
  await CacheService.delete(`otp:${reason}:${email}`);
  if (reason === emailReasons.VERIFY_EMAIL) {
    currUser.isVerified = true;
    await currUser.save({ validateModifiedOnly: true });
    const accessToken = genAccessToken(currUser);
    return { accessToken };
  }
  return null;
};

export const forgetPasswordService = async (
  email: string,
  protocol: string,
  host: string,
): Promise<string | boolean> => {
  const currUser = await ParentModel.findOne({ email });
  if (!currUser) return false;

  const { token, hashedToken } = AuthUtils.generateCryptoToken();
  await CacheService.setWithTTL(
    `token:${emailReasons.RESET_PASSWORD}:${hashedToken}`,
    currUser.id,
    config.TOKEN_EXPIRES * 60,
  );
  const resetURL =
    config.BASE_URL +
    createPath(
      {
        path: `${API.AUTH.PREFIX}${API.AUTH.ROUTES.RESET_PASSWORD.path}` as const,
      },
      { token: token },
    );

  eventBus.emit(AppEvents.SEND_EMAIL, {
    type: emailReasons.RESET_PASSWORD,
    to: currUser.email,
    data: {
      name: currUser.firstName,
      reset_url: resetURL,
      expiry_minutes: `${config.OTP_EXPIRES_IN}`,
    },
  });

  if (config.IS_DEV_ENV) return token;
  else return true;
};

export const resetPasswordService = async (
  token: string,
  newPassword: string,
): Promise<{ accessToken: string }> => {
  const hashToken = AuthUtils.hashCryptoToken(token);
  const userId = await CacheService.get(
    `token:${emailReasons.RESET_PASSWORD}:${hashToken}`,
  );
  if (!userId) {
    throw new AppError(
      'Token is invalid or has expired.',
      HttpStatusCode.BAD_REQUEST,
    );
  }
  logger.error(userId);
  const currUser = await ParentModel.findById(userId);

  if (!currUser) {
    throw new AppError(
      'Token is invalid or has expired.',
      HttpStatusCode.BAD_REQUEST,
    );
  }

  currUser.password = await AuthUtils.hashPassword(newPassword);
  currUser.passwordChangedAt = new Date(Date.now() - 1000);

  await currUser.save();

  const accessToken = genAccessToken(currUser);

  return { accessToken };
};

export const logoutService = async (refreshToken: string): Promise<void> => {
  const currUser = await ParentModel.findOne({ refreshToken });
  if (currUser) {
    currUser.refreshToken = undefined;
    await currUser.save({ validateBeforeSave: false });
  }
};

export const refreshTokenService = async (
  refreshToken: string | undefined,
): Promise<{ accessToken: string }> => {
  if (!refreshToken) {
    throw new AppError(
      'No refresh token provided',
      HttpStatusCode.UNAUTHORIZED,
    );
  }
  const decoded = verifyToken<JwtPayload>(refreshToken);

  if (!decoded?.id) {
    throw new AppError(
      'Invalid or expired refresh token',
      HttpStatusCode.FORBIDDEN,
    );
  }
  const currUser = await ParentModel.findById(decoded.id);
  if (
    !currUser ||
    !currUser.isActive ||
    currUser.refreshToken !== refreshToken
  ) {
    throw new AppError(
      'Invalid refresh token session.',
      HttpStatusCode.FORBIDDEN,
    );
  }
  const accessToken = genAccessToken(currUser);
  return { accessToken };
};
