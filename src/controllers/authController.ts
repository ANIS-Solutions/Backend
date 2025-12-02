import { ParentModel } from '@models/authModels';
import { catchAsync } from '@utils/catchAsync';
import HttpStatusCode from '@utils/HttpStatusCode';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import z from 'zod';

// interface IRegister {
//   email: string;
//   password: string;
//   phone: string;
//   firstName: string;
//   lastName: string;
//   birthDate: Date;
// }

export const registerSchema = z.object({
  body: z.object({
    email: z.email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().min(10, 'Phone number'),
    firstName: z
      .string()
      .min(2, 'First name required')
      .max(14, 'No name more than 14 char'),
    lastName: z
      .string()
      .min(2, 'Last name required')
      .max(14, 'No name more than 14 char'),
    birthDate: z.coerce.date(),
  }),
});

type RegisterInput = z.infer<typeof registerSchema>['body'];

/* eslint-disable @typescript-eslint/no-empty-object-type */
export const register = catchAsync(
  async (
    req: Request<{}, {}, RegisterInput>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    const { email, password, phone, firstName, lastName, birthDate } = req.body;
    const existing = await ParentModel.findOne({ email });
    if (existing)
      return res
        .status(HttpStatusCode.CONFLICT)
        .json({ message: 'Email already exists.' });
    const passwordHash: string = password;
    const newUser = await ParentModel.create({
      email,
      password: passwordHash,
      phone,
      firstName,
      lastName,
      birthDate,
    });

    return res.status(HttpStatusCode.CREATED).json({
      message: 'Register Successfully.',
      user: newUser,
    });
  },
);

export const login: RequestHandler = async (req, res, next) => {
  res.send('login endpoint');
};
export const logout: RequestHandler = async (req, res, next) => {
  res.send('logout endpoint');
};
export const verify_otp: RequestHandler = async (req, res, next) => {
  res.send('verify_otp endpoint');
};
export const verify_email: RequestHandler = async (req, res, next) => {
  res.send('verify_email endpoint');
};
export const change_password: RequestHandler = async (req, res, next) => {
  res.send('change_password endpoint');
};
export const forget_password: RequestHandler = async (req, res, next) => {
  res.send('forget_password endpoint');
};
export const reset_password: RequestHandler = async (req, res, next) => {
  res.send('reset_password endpoint');
};
export const refresh_token: RequestHandler = async (req, res, next) => {
  res.send('refresh_token endpoint');
};
