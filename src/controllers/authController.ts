/* eslint-disable no-console */
import crypto from 'crypto';

import { ParentModel } from '@models/authModels';
import {
  ForgetPasswordInput,
  LoginInput,
  OTPInput,
  RegisterInput,
  ResetPasswordInput,
  VerifyOTPInput,
} from '@schemas/authSchema';
import { signAccessToken } from '@services/authService';
import sendResetTokenEmail from '@services/sendResetTokenEmail';
import AppError from '@utils/AppError';
import { catchAsync } from '@utils/catchAsync';
import HttpStatusCode from '@utils/HttpStatusCode';
import { NextFunction, Request, RequestHandler, Response } from 'express';

// interface IRegister {
//   email: string;
//   password: string;
//   phone: string;
//   firstName: string;
//   lastName: string;
//   birthDate: Date;
// }

// export const signToken = (obj: JwtObject): string => {
//   return jwt.sign(obj, config.JWT_SECRET, {
//     expiresIn: config.JWT_EXPIRES_IN,
//   } as SignOptions);
// };

/* eslint-disable @typescript-eslint/no-empty-object-type */
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
    // logger.info(newUser._id.toString());
    // logger.info(newUser._id);
    return res.status(HttpStatusCode.CREATED).json({
      success: true,
      message: 'Registration successful',
      data: { user: newUser },
      token,
      // refresh_token: 'sss',
    });
  },
);

export const login: RequestHandler = catchAsync(
  async (
    req: Request<{}, {}, LoginInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const { email, password } = req.body;
    console.log(req.body);

    if (!email || !password) {
      return next(
        new AppError(
          'Please provide email and password',
          HttpStatusCode.BAD_REQUEST,
        ),
      );
    }
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

export const generate_otp = catchAsync(
  async (req: Request<{}, {}, OTPInput>, res: Response, next: NextFunction) => {
    const { email } = req.body;
    const currUser = await ParentModel.findOne({ email }).select('+otp');
    if (!currUser) {
      // SECURITY: Return 200 OK even if user doesn't exists
      console.log('wink wink : not user');
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
    const otp = await currUser.generateOTP('register');
    await currUser.save({ validateModifiedOnly: true });
    console.log(`USER ${email} -> ${otp}`);
    // Send mail from here.
    return res.status(HttpStatusCode.OK).send({
      success: true,
      message: 'OTP sent successfully.',
      otp,
    });
  },
);
export const verify_otp = catchAsync(
  async (
    req: Request<{}, {}, VerifyOTPInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const { email, otpCode } = req.body;
    const currUser = await ParentModel.findOne({ email });
    console.log(currUser);
    if (!currUser || !currUser?.isActive) {
      console.log('wink wink : not user');
      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: 'Your account email is inactive.',
      });
    }

    if (
      !currUser?.otp?.expiresAt ||
      currUser.otp.expiresAt.getTime() < Date.now()
    ) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: 'OTP is invalid or expired.',
      });
    }

    const otp = await currUser.verifyOTP(otpCode, currUser.otp.code);
    console.log(`USER ${email} -> ${otp}`);
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
export const forget_password = async (
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
  console.log(
    'Check Point 1 --------------------------------------------------------------',
  );
  const resetToken = currUser.createPasswordResetToken();
  await currUser.save({ validateBeforeSave: false });
  console.log(currUser);
  console.log(resetToken);
  const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  console.log(
    'Check Point 1 --------------------------------------resetToken done ------------------------',
  );
  const message = `Forgot your password? Submit a PATCH request with your new password to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;
  await sendResetTokenEmail({
    email: 'ah.abbas333@gmail.com',
    subject: 'Your Password Reset Token (Valid for 10 min)',
    message,
  });
  console.log(
    'Check Point 1 ------------------------------------------mail set  done--------------------',
  );
  // if (!emailStatus) {
  //   return next(
  //     new AppError(
  //       'There was an error sending the email. Try again later!',
  //       HttpStatusCode.INTERNAL_SERVER_ERROR,
  //     ),
  //   );
  // }
  res.status(HttpStatusCode.OK).json({
    success: true,
    message: 'Reset token sent to email!',
  });
};
export const reset_password = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // if (!req?.params?.token) {
    //   return next(new AppError('Token not founded.', HttpStatusCode.BAD_REQUEST));
    // }
    const { token } = req.params as ResetPasswordInput['params'];
    const { password } = req.body as ResetPasswordInput['body'];
    console.log('ana token');
    console.log(token);
    const hashToken = crypto.createHash('sha256').update(token).digest('hex');
    const currUser = await ParentModel.findOne({
      passwordResetToken: hashToken, //92b9211d8ee7c55bef7be362379438b1f267c73fbee80d866e306f72c5b45117
      // passwordResetTokenExpire: { $gt: Date.now() - 1000 }, 92b9211d8ee7c55bef7be362379438b1f267c73fbee80d866e306f72c5b45117
    });
    console.log(currUser);
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
// export const logout: RequestHandler = async (req, res, next) => {
//   res.send('logout endpoint');
// };

// export const change_password: RequestHandler = async (req, res, next) => {
//   res.send('change_password endpoint');
// };

// export const reset_password: RequestHandler = async (req, res, next) => {
//   res.send('reset_password endpoint');
// };
// export const refresh_token: RequestHandler = async (req, res, next) => {
//   res.send('refresh_token endpoint');
// };
