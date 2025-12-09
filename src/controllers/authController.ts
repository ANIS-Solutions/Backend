import crypto from 'crypto';

import { ParentModel } from '@models/authModels';
import {
  ChangePasswordInput,
  DeactivateAccountInput,
  ForgetPasswordInput,
  LoginInput,
  LogoutInput,
  OTPInput,
  RegisterInput,
  ResetPasswordInput,
  UpdateProfileInput,
  VerifyOTPInput,
} from '@schemas/authSchema';
import { signAccessToken } from '@services/authService';
import sendResetTokenEmail from '@services/sendResetTokenEmail';
import AppError from '@utils/AppError';
import { catchAsync } from '@utils/catchAsync';
import HttpStatusCode from '@utils/HttpStatusCode';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';

/* eslint-disable @typescript-eslint/no-empty-object-type */

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
    return res.status(HttpStatusCode.CREATED).json({
      success: true,
      message: 'Registration successful',
      data: { user: newUser },
      token,
    });
  },
);

// ===============================    Login Account   ===============================

export const login: RequestHandler = catchAsync(
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
    const token = signAccessToken({ userId: currUser._id.toString() });
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
    return res.status(HttpStatusCode.OK).send({
      success: true,
      message: 'OTP sent successfully.',
      otp,
    });
  },
);

// ===============================     Verify OTP     ===============================

export const verify_otp = catchAsync(
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
    // const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
    const message = `Forgot your password? Submit a PATCH request with your new password to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;
    await sendResetTokenEmail({
      email: 'ah.abbas333@gmail.com',
      subject: 'Your Password Reset Token (Valid for 10 min)',
      message,
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

export const deactivate_account: RequestHandler = async (
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
};

export const logout: RequestHandler = async (
  req: Request<{}, {}, LogoutInput>,
  res: Response,
  next: NextFunction,
) => {
  // const { email } = req.body;
  const { userId } = req.user as JwtPayload;
  const currUser = await ParentModel.findById({ userId });

  if (!currUser || !currUser.isActive) {
    return res.status(HttpStatusCode.UNAUTHORIZED).json({
      success: true,
      message: 'Email is not registered or deactivated.',
    });
  }
  currUser.refreshToken = undefined;
  await currUser.save({ validateBeforeSave: false });

  return res.status(HttpStatusCode.OK).json({
    success: true,
    message: 'logged out successfully!',
  });
};

export const change_password: RequestHandler = async (
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
};

export const update_profile: RequestHandler = async (
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
};
// export const refresh_token: RequestHandler = async (req, res, next) => {
//   res.send('refresh_token endpoint');
// };
export const testOperation: RequestHandler = catchAsync(
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
