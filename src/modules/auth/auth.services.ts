import crypto from 'crypto';

import config from '@/config/base';
import { emailService } from '@/core/handlers/email.handler';
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from '@/core/handlers/jwt.handler';
import AppError from '@/core/utils/AppError';
import logger from '@/core/utils/logger';
import { HttpStatusCode } from '@anis/shared';
import { JwtPayload } from 'jsonwebtoken';

import { IParent, ParentModel } from './auth.model.js';
import {
  ChangePasswordBodyInput,
  ForgetPasswordBodyInput,
  LoginBodyInput,
  OTPBodyInput,
  RegisterBodyInput,
  UpdateProfileBodyInput,
  VerifyOTPBodyInput,
} from './auth.schema.js';

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
  const newUser = await ParentModel.create({
    email,
    password,
    phone,
    firstName,
    lastName,
    birthDate,
  });
  const accessToken = signAccessToken({ userId: newUser._id.toString() });

  const refreshToken = signRefreshToken({
    userId: newUser._id.toString(),
  });

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
    !(await currUser.correctPassword(password, currUser.password))
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
  const accessToken = signAccessToken({ userId: currUser._id.toString() });
  const refreshToken = signRefreshToken({
    userId: currUser._id.toString(),
  });

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

  const cooldown = 60_000;
  if (
    currUser.otp?.lastRequest &&
    Date.now() - currUser.otp.lastRequest.getTime() < cooldown
  ) {
    throw new AppError(
      `Please wait ${parseInt(`${cooldown / 1000}`, 10)} minute before requesting another OTP`,
      HttpStatusCode.TOO_MANY_REQUESTS,
    );
  }
  const otp = await currUser.generateOTP(reason);
  await currUser.save({ validateModifiedOnly: true });
  const exp_date = new Date(Date.now() + config.OTP_EXPIRES_IN * 60_000);
  emailService
    .send({
      to: currUser.email,
      type: 'VERIFY_OTP',
      data: {
        name: currUser.firstName,
        otp,
        expiry_minutes: `${config.OTP_EXPIRES_IN}`,
        expiry_time: `${exp_date.toLocaleString()}`,
      },
    })
    .catch((err) => logger.error('Background email failed', err));
};
export const verifyOTPService = async (
  verifyOtpData: VerifyOTPBodyInput,
): Promise<{ accessToken: string }> => {
  const { email, otp, reason } = verifyOtpData;
  const currUser = await ParentModel.findOne({ email });
  if (!currUser || !currUser.isActive) {
    throw new AppError(
      `Your account email is inactive.`,
      HttpStatusCode.FORBIDDEN,
    );
  }

  if (!(await currUser.verifyOTP(otp, reason))) {
    throw new AppError(
      `OTP is invalid or expired.`,
      HttpStatusCode.BAD_REQUEST,
    );
  }
  currUser.otp = undefined;
  currUser.isVerified = true;
  await currUser.save({ validateModifiedOnly: true });

  const accessToken = signAccessToken({ userId: currUser._id.toString() });
  return { accessToken };
};

export const forgetPasswordService = async (
  email: string,
  protocol: string,
  host: string,
): Promise<boolean> => {
  const currUser = await ParentModel.findOne({ email });
  if (!currUser) return false;

  const resetToken = currUser.createPasswordResetToken();
  await currUser.save({ validateBeforeSave: false });
  const resetURL = `${protocol}://${host}/api/v1/parent/reset-password/${resetToken}`;
  emailService
    .send({
      to: currUser.email,
      type: 'RESET_PASSWORD',
      data: {
        name: currUser.firstName,
        reset_url: resetURL,
        expiry_minutes: `${config.OTP_EXPIRES_IN}`,
      },
    })
    .catch((err) => logger.error('Background email failed', err));
  return true;
};

export const resetPasswordService = async (
  token: string,
  newPassword: string,
): Promise<{ accessToken: string }> => {
  const hashToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await ParentModel.findOne({
    passwordResetToken: hashToken,
    passwordResetTokenExpire: { $gt: Date.now() },
    // passwordResetTokenExpire: { $gt: Date.now() - 1000 }, 92b9211d8ee7c55bef7be362379438b1f267c73fbee80d866e306f72c5b45117
  });

  if (!user) {
    throw new AppError(
      'Token is invalid or has expired.',
      HttpStatusCode.BAD_REQUEST,
    );
  }

  user.password = newPassword;
  user.passwordChangedAt = new Date(Date.now());
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpire = undefined;
  await user.save();

  const accessToken = signAccessToken({ userId: user._id });

  return { accessToken };
};

export const deactivateAccountService = async (
  otp: string,
  reason: string,
  userId: string | undefined,
): Promise<void> => {
  const currUser = await ParentModel.findById(userId);
  if (!userId)
    throw new AppError('Not authorized user!', HttpStatusCode.UNAUTHORIZED);
  if (!currUser || !currUser.isActive) {
    throw new AppError('Email already inactive.', HttpStatusCode.UNAUTHORIZED);
  }

  if (!(await currUser.verifyOTP(otp, reason))) {
    throw new AppError(
      'OTP is invalid or expired.',
      HttpStatusCode.BAD_REQUEST,
    );
  }
  currUser.isActive = false;
  await currUser.save({ validateBeforeSave: false });
};
export const reactivateAccountService = async (
  email: string,
  protocol: string,
  host: string,
): Promise<void> => {
  const currUser = await ParentModel.findOne({ email });
  if (!currUser) {
    return;
  }
  const reactivateToken = currUser.createReactivateToken();
  await currUser.save({ validateBeforeSave: false });
  const reactivateURL = `${protocol}://${host}/api/v1/auth/reactivate/${reactivateToken}`;
  await emailService
    .send({
      to: currUser.email,
      type: 'REACTIVATE',
      data: {
        name: currUser.firstName,
        url: reactivateURL,
      },
    })
    .catch((err) => logger.error('Background email failed', err));
};
export const logoutService = async (refreshToken: string): Promise<void> => {
  const currUser = await ParentModel.findOne({ refreshToken });
  if (currUser) {
    currUser.refreshToken = undefined;
    await currUser.save({ validateBeforeSave: false });
  }
};

export const changePasswordService = async (
  reqBody: ChangePasswordBodyInput,
  userId: string,
): Promise<void> => {
  const { oldPassword, password } = reqBody;

  const currUser = await ParentModel.findById(userId).select('+password');

  if (
    !currUser ||
    !(await currUser?.correctPassword(oldPassword, currUser.password))
  ) {
    throw new AppError('Password changed failed.', HttpStatusCode.UNAUTHORIZED);
  }
  currUser.password = password;
  await currUser.save();
};
export const updateProfileService = async (
  updatedData: UpdateProfileBodyInput,
  userId: string | undefined,
) => {
  // TODO: check if it bypass mongoose plugin
  const currUser = await ParentModel.findByIdAndUpdate(userId, updatedData, {
    returnOriginal: false,
  });
  if (!currUser) {
    throw new AppError('User not found!', HttpStatusCode.BAD_REQUEST);
  }
  await currUser.save();
  return { currUser };
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

  if (!decoded?.userId) {
    throw new AppError(
      'Invalid or expired refresh token',
      HttpStatusCode.FORBIDDEN,
    );
  }
  const currUser = await ParentModel.findById(decoded.userId);
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
  const accessToken = signAccessToken({ userId: currUser._id.toString() });
  return { accessToken };
};
export const getMeService = async (reqData: IParent) => {
  const user = reqData;

  const currUser = await ParentModel.findById(user._id);
  return currUser;
};
