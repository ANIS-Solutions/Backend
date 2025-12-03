import { ParentModel } from '@models/authModels';
import { catchAsync } from '@utils/catchAsync';
import HttpStatusCode from '@utils/HttpStatusCode';
import { DiversityType, passwordStrength } from 'check-password-strength';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { phone } from 'phone';
import { z } from 'zod';

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

export const registerSchema = z.object({
  body: z.object({
    email: z.email('Invalid email address').trim().toLowerCase(),
    password: z
      .string()
      // .min(8, 'Password must be at least 8 characters')
      .superRefine((password, ctx) => {
        const verdict = passwordStrength(password);

        const missing: string[] = [];
        ['lowercase', 'uppercase', 'number', 'symbol'].map((el) => {
          if (!verdict.contains.includes(el as DiversityType)) missing.push(el);
        });

        const isStrong =
          !missing.length &&
          (verdict.length >= 8 || ['Medium', 'Strong'].includes(verdict.value));
        if (isStrong) return;

        let message = 'Password is weak.';
        if (missing.length) {
          message += ` It must include: ${missing.join(', ')}.`;
        }
        if (verdict.length < 8) {
          message += ` It's length ${verdict.length} is invalid, must be more than 8 characters.`;
        }

        ctx.addIssue({
          code: 'custom',
          message,
        });
      }),

    // phone: z.string().min(10, 'Phone number'),
    phone: z.string().transform((phone_number: string, ctx): string => {
      const ret = phone(phone_number);
      if (!ret.isValid) {
        ctx.addIssue({
          code: 'custom', //? z.ZodIssueCode.custom => Deprecated
          message: 'Invalid phone number',
        });
        return z.NEVER;
      }
      return ret.phoneNumber;
    }), //ds: sddsds
    firstName: z
      .string()
      .trim()
      .min(2, 'First name required')
      .max(14, 'No name more than 14 char')
      .regex(/^[\p{L}\s'-]+$/u, 'First name contains non-alphabtic characters'), //! /^[a-zA-Z\s\-']+$/
    lastName: z
      .string()
      .trim()
      .min(2, 'Last name required')
      .max(14, 'No name more than 14 char')
      .regex(/^[\p{L}\s'-]+$/u, 'Last name contains non-alphabtic characters'),

    birthDate: z.coerce.date().refine(
      (date) => {
        const today = new Date();
        return today.getFullYear() - date.getFullYear() >= 18;
      },
      { message: 'The parent must older than 18 years old.' },
    ),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];

/* eslint-disable @typescript-eslint/no-empty-object-type */
export const register = catchAsync(
  async (
    req: Request<{}, {}, RegisterInput>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    const { email, password, phone, firstName, lastName, birthDate } = req.body;
    // const existing = await ParentModel.findOne({ $or: [{ email }, { phone }] });
    // if (existing) {
    //   const field = existing.email === email ? 'Email' : 'Phone number';
    //   return res
    //     .status(HttpStatusCode.CONFLICT)
    //     .json({ success: false, message: `${field} already exists.` });
    // }
    const passwordHash: string = password;
    const newUser = await ParentModel.create({
      email,
      password: passwordHash,
      phone,
      firstName,
      lastName,
      birthDate,
    });
    //? option-1
    // const userResponse = newUser.toObject();
    // delete (userResponse as { password?: string }).password;
    //? option-2
    // const userObject = newUser.toObject();
    // const { password: _, ...userResponse } = userObject;

    return res.status(HttpStatusCode.CREATED).json({
      success: true,
      message: 'Registration successful',
      data: { user: newUser },
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
