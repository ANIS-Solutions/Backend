/* eslint-disable no-console */
import { ParentModel } from '@models/authModels';
import {
  ForgetPasswordInput,
  LoginInput,
  OTPInput,
  RegisterInput,
  VerifyOTPInput,
} from '@schemas/authSchema';
import { signAccessToken } from '@services/authService';
import AppError from '@utils/AppError';
import { catchAsync } from '@utils/catchAsync';
import HttpStatusCode from '@utils/HttpStatusCode';
import logger from '@utils/logger';
import { NextFunction, Request, RequestHandler, Response } from 'express';

// interface IRegister {
//   email: string;
//   password: string;
//   phone: string;
//   firstName: string;
//   lastName: string;
//   birthDate: Date;
// }

// export const hamada = (userId: number): string => {
//   return jwt.sign({ userId }, config.JWT_SECRET, {
//     expiresIn: config.JWT_EXPIRES_IN,
//   } as SignOptions);
// };

// export const signToken = (obj: JwtObject): string => {
//   return jwt.sign(obj, config.JWT_SECRET, {
//     expiresIn: config.JWT_EXPIRES_IN,
//   } as SignOptions);
// };

/* eslint-disable @typescript-eslint/no-empty-object-type */
export const register = catchAsync(
  async (
    req: Request<{}, {}, RegisterInput>,
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
    const passwordHash: string = password;
    const newUser = await ParentModel.create({
      email,
      password: passwordHash,
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
    logger.info(newUser._id.toString());
    logger.info(newUser._id);
    return res.status(HttpStatusCode.CREATED).json({
      success: true,
      message: 'Registration successful',
      data: { user: newUser },
      token,
      refresh_token: 'sss',
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
export const forget_password = async (
  req: Request<{}, {}, ForgetPasswordInput>,
  res: Response,
  next: NextFunction,
) => {
  const currUserEmail: string = req.body.email;

  const currUser = await ParentModel.findOne({ email: currUserEmail });
  if (!currUser) {
    return next(
      new AppError(
        'There is no user here with this email address.',
        HttpStatusCode.NOT_FOUND,
      ),
    );
  }
  const resetToken = currUser.createPasswordResetToken();
  console.log(currUser);
  console.log(resetToken);
  return res
    .status(HttpStatusCode.OK)
    .send({ msg: 'hamada yel3b', resetToken });
};
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
