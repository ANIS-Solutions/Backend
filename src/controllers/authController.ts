/* eslint-disable @typescript-eslint/no-empty-object-type */
import crypto from 'crypto';

import config from '@configs/base';
import { ParentModel } from '@models/authModels';
import {
  ChangePasswordInput,
  DeactivateAccountInput,
  ForgetPasswordInput,
  LoginInput,
  OTPInput,
  ReactivatePasswordInput,
  RegisterInput,
  ResetPasswordInput,
  UpdateProfileInput,
  VerifyOTPInput,
} from '@schemas/authSchema';
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from '@services/authService';
import { emailService } from '@services/emailService';
import AppError from '@utils/AppError';
import { catchAsync } from '@utils/catchAsync';
import HttpStatusCode from '@utils/HttpStatusCode';
import { NextFunction, Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';

// ===============================  Register Account  ===============================

export const register = catchAsync(
  async (
    req: Request<{}, {}, RegisterInput>, // req.params, req.query, req.body
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    const { email, password, phone, firstName, lastName, birthDate } = req.body;
    const existing = await ParentModel.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      if (!existing.isActive) {
        return next(
          new AppError(
            'This account is deactivated, to reactivate it, POST /auth/reactivate .',
            HttpStatusCode.BAD_REQUEST,
          ),
        );
      }
      const field = existing.email === email ? 'Email' : 'Phone number';
      return res
        .status(HttpStatusCode.CONFLICT)
        .json({ success: false, message: `${field} already exists.` });
    }
    const newUser = await ParentModel.create({
      email,
      password,
      phone,
      firstName,
      lastName,
      birthDate,
    });
    // ? option-1
    // const userResponse = newUser.toObject();
    // delete (userResponse as { password?: string }).password;
    // ? option-2
    // const userObject = newUser.toObject();
    // const { password: _, ...userResponse } = userObject;
    const token = signAccessToken({ userId: newUser._id.toString() });

    const refreshToken = signRefreshToken({
      userId: newUser._id.toString(),
    });

    newUser.refreshToken = refreshToken;
    await newUser.save({ validateBeforeSave: false });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.IS_PROD_ENV,
      sameSite: true,
      maxAge: 7 * 24 * 60 * 60_000,
    });

    return res.status(HttpStatusCode.CREATED).json({
      success: true,
      message: 'Registration successful',
      data: { user: newUser },
      token,
    });
  },
);

// ===============================    Login Account   ===============================

export const login = catchAsync(
  async (
    req: Request<{}, {}, LoginInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const { email, password } = req.body;
    const currUser = await ParentModel.findOne({ email }).select('+password');

    if (
      !currUser ||
      !(await currUser.correctPassword(password, currUser.password))
    ) {
      return next(
        new AppError(
          'Please provide correct email and password.',
          HttpStatusCode.UNAUTHORIZED,
        ),
      );
    }
    if (!currUser.isActive) {
      return next(
        new AppError(
          'This account is deactivated, to reactivate it, POST /auth/reactivate .',
          HttpStatusCode.BAD_REQUEST,
        ),
      );
    }
    const token = signAccessToken({ userId: currUser._id.toString() });
    const refreshToken = signRefreshToken({
      userId: currUser._id.toString(),
    });

    currUser.refreshToken = refreshToken;
    await currUser.save({ validateBeforeSave: false });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.IS_PROD_ENV,
      sameSite: true,
      maxAge: 7 * 24 * 60 * 60_000,
    });

    return res.status(HttpStatusCode.OK).json({
      success: true,
      message: 'You logged in successfully!',
      token,
    });
  },
);

// ===============================    Generate OTP    ===============================

export const generate_otp = catchAsync(
  async (req: Request<{}, {}, OTPInput>, res: Response, next: NextFunction) => {
    const { email, reason } = req.body;
    const currUser = await ParentModel.findOne({ email }).select('+otp');
    if (!currUser) {
      // SECURITY: Return 200 OK even if user doesn't exists
      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: 'OTP sent successfully.',
      });
    }
    const cooldown = 60_000;
    if (
      currUser.otp?.lastRequest &&
      Date.now() - currUser.otp.lastRequest.getTime() < cooldown
    ) {
      return next(
        new AppError(
          `Please wait ${parseInt(`${cooldown / 1000}`, 10)} minute before requesting another OTP`,
          HttpStatusCode.TOO_MANY_REQUESTS,
        ),
      );
    }
    const otp = await currUser.generateOTP(reason);
    await currUser.save({ validateModifiedOnly: true });
    // Send mail from here.
    const exp_date = new Date(Date.now() + config.OTP_EXPIRES_IN * 60_000);
    await emailService.send({
      to: currUser.email,
      type: 'VERIFY_OTP',
      data: {
        name: currUser.firstName,
        otp,
        expiry_minutes: `${config.OTP_EXPIRES_IN}`,
        expiry_time: `${exp_date.toLocaleString()}`,
        help_url: '#',
        terms_url: '#',
        privacy_url: '#',
        unsubscribe_url: '#',
        twitter_url: '#',
        facebook_url: '#',
        linkedin_url: '#',
      },
    });
    return res.status(HttpStatusCode.OK).send({
      success: true,
      message: 'OTP sent successfully.',
      otp,
    });
  },
);

// ===============================     Verify OTP     ===============================

export const verify_otp = catchAsync(
  // TODO: will improved later with redis.
  async (
    req: Request<{}, {}, VerifyOTPInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const { email, otp, reason } = req.body;
    const currUser = await ParentModel.findOne({ email });
    if (!currUser || !currUser.isActive) {
      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: 'Your account email is inactive.',
      });
    }

    if (!(await currUser.verifyOTP(otp, reason))) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: 'OTP is invalid or expired.',
      });
    }
    currUser.otp = undefined;
    currUser.isVerified = true;
    await currUser.save({ validateModifiedOnly: true });

    const token = signAccessToken({ userId: currUser._id.toString() });
    return res.status(HttpStatusCode.OK).send({
      success: true,
      message: 'OTP verified successfully.',
      token,
    });
  },
);

// ===============================   Forget Password  ===============================

export const forget_password = catchAsync(
  async (
    req: Request<{}, {}, ForgetPasswordInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const currUserEmail: string = req.body.email;

    const currUser = await ParentModel.findOne({ email: currUserEmail });
    if (!currUser) {
      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: 'Email sent successfully.',
      });
    }
    const resetToken = currUser.createPasswordResetToken();
    await currUser.save({ validateBeforeSave: false });
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
    // const message = `Forgot your password? Submit a PATCH request with your new password to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;
    // await sendResetTokenEmail({
    //   email: 'ah.abbas333@gmail.com',
    //   subject: 'Your Password Reset Token (Valid for 10 min)',
    //   message,
    // });
    await emailService.send({
      to: currUser.email,
      type: 'RESET_PASSWORD',
      data: {
        name: currUser.firstName,
        reset_url: resetURL,
        expiry_minutes: `${config.OTP_EXPIRES_IN}`,
      },
    });
    res.status(HttpStatusCode.OK).json({
      success: true,
      message: 'Reset token sent to email!',
    });
  },
);

// ===============================   Reset Password   ===============================

export const reset_password = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.params as ResetPasswordInput['params'];
    const { password } = req.body as ResetPasswordInput['body'];
    const hashToken = crypto.createHash('sha256').update(token).digest('hex');
    const currUser = await ParentModel.findOne({
      passwordResetToken: hashToken,
      // passwordResetTokenExpire: { $gt: Date.now() - 1000 }, 92b9211d8ee7c55bef7be362379438b1f267c73fbee80d866e306f72c5b45117
    });
    if (!currUser) {
      return next(
        new AppError(
          'Token is invalid or has expired.',
          HttpStatusCode.BAD_REQUEST,
        ),
      );
    }
    currUser.password = password;
    currUser.passwordChangedAt = new Date(Date.now());
    currUser.passwordResetToken = undefined;
    currUser.passwordResetTokenExpire = undefined;
    await currUser.save();
    const newToken = signAccessToken({ userId: currUser._id.toString() });
    return res.status(HttpStatusCode.OK).json({
      success: true,
      message: 'Password reset successful!',
      token: newToken,
    });
  },
);

// =============================== Deactivate Account ===============================

export const deactivate_account = catchAsync(
  async (
    req: Request<{}, {}, DeactivateAccountInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const { otp, reason } = req.body;
    const { userId } = req.user as JwtPayload;
    const currUser = await ParentModel.findById(userId);

    if (!currUser || !currUser.isActive) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        success: true,
        message: 'Email already inactive.',
      });
    }

    if (!(await currUser.verifyOTP(otp, reason))) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: 'OTP is invalid or expired.',
      });
    }
    currUser.isActive = false;
    await currUser.save({ validateBeforeSave: false });

    return res.status(HttpStatusCode.OK).json({
      success: true,
      message: 'Account is deactivated successfully!',
    });
  },
);

// =============================== Deactivate Account ===============================

export const reactivate_account = catchAsync(
  async (
    req: Request<{}, {}, ReactivatePasswordInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const currUserEmail: string = req.body.email;

    const currUser = await ParentModel.findOne({ email: currUserEmail });
    if (!currUser) {
      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: 'Email sent successfully.',
      });
    }
    const reactivateToken = currUser.createReactivateToken();
    await currUser.save({ validateBeforeSave: false });
    const reactivateURL = `${req.protocol}://${req.get('host')}/api/v1/auth/reactivate/${reactivateToken}`;
    // const message = `Forgot your password? Submit a PATCH request with your new password to: ${reactivateURL}.\nIf you didn't forget your password, please ignore this email!`;
    // TODO: Send Reactivate Email
    // await sendReactivateTokenEmail({
    //   email: 'ah.abbas333@gmail.com',
    //   subject: 'Your Password Reset Token (Valid for 10 min)',
    //   message,
    // });
    await emailService.send({
      to: currUser.email,
      type: 'REACTIVATE',
      data: {
        name: currUser.firstName,
        url: reactivateURL,
        dashboard_url: '#',
        unsubscribe_url: '#',
        help_url: '#',
        twitter_url: '#',
        facebook_url: '#',
        linkedin_url: '#',
      },
    });
    res.status(HttpStatusCode.OK).json({
      success: true,
      message: 'Reset token sent to email!',
    });
  },
);

// ===============================       Logout       ===============================

export const logout = catchAsync(
  async (req: Request<{}, {}, {}>, res: Response, next: NextFunction) => {
    const cookies = req.cookies as { refreshToken?: string };
    if (!cookies.refreshToken) {
      return res.sendStatus(HttpStatusCode.NO_CONTENT);
    }
    const refreshToken = cookies.refreshToken;
    const currUser = await ParentModel.findOne({ refreshToken });
    if (currUser) {
      currUser.refreshToken = undefined;
      await currUser.save({ validateBeforeSave: false });
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: config.IS_PROD_ENV,
      sameSite: 'strict',
    });
    return res
      .status(HttpStatusCode.OK)
      .json({ success: true, message: 'Logged out successfully' });
  },
);

// ===============================  Change Password   ===============================

export const change_password = catchAsync(
  async (
    req: Request<{}, {}, ChangePasswordInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const { oldPassword, password } = req.body;
    const { userId } = req.user as JwtPayload;
    const currUser = await ParentModel.findById(userId).select('+password');

    if (
      !currUser ||
      !(await currUser?.correctPassword(oldPassword, currUser.password))
    ) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        success: true,
        message: 'Password changed failed.',
      });
    }
    currUser.password = password;
    await currUser.save();
    return res.status(HttpStatusCode.OK).json({
      success: true,
      message: 'password changed successfully!',
    });
  },
);

// ===============================   Update  Profile  ===============================

export const update_profile = catchAsync(
  async (
    req: Request<{}, {}, UpdateProfileInput>,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const all = req.body;
    const { userId } = req.user as JwtPayload;
    const currUser = await ParentModel.findByIdAndUpdate(userId, all, {
      returnOriginal: false,
    });
    if (!currUser) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        success: true,
        message: 'User not founded!',
      });
    }
    await currUser.save();
    return res.status(HttpStatusCode.OK).json({
      success: true,
      message: 'Profile updated successfully!',
    });
  },
);

// ===============================    Refresh Token   ===============================

export const refresh_token = catchAsync(
  async (req: Request, res: Response, next) => {
    const cookies = req.cookies as { refreshToken: string };
    // if (!cookies.refreshToken) return res.sendStatus(HttpStatusCode.NO_CONTENT);
    if (!cookies?.refreshToken) {
      return next(
        new AppError(
          'No Refresh Token found. Please login again.',
          HttpStatusCode.UNAUTHORIZED,
        ),
      );
    }
    const refreshToken = cookies.refreshToken;
    const decoded = verifyToken<JwtPayload>(refreshToken);
    console.log(decoded);

    if (!decoded?.userId) {
      return next(
        new AppError('Invalid Token Payload.', HttpStatusCode.FORBIDDEN),
      );
    }
    const currUser = await ParentModel.findById(decoded.userId);
    console.log(decoded.userId);
    if (
      !currUser ||
      !currUser.isActive ||
      currUser.refreshToken !== refreshToken
    ) {
      return next(
        new AppError(
          'Invalid Request. Please login again.',
          HttpStatusCode.FORBIDDEN,
        ),
      );
    }
    const accessToken = signAccessToken({ userId: currUser._id.toString() });
    return res.status(HttpStatusCode.OK).json({
      success: true,
      token: accessToken,
    });
  },
);

// ===============================    Get all users   ===============================

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
