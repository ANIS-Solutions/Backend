import {
  checkConfirmPassword,
  otpReasonValues,
  validatePassword,
  validatePhone,
} from '@/core/utils/schema.utils';
import { ParentValidationRules } from '@anis/shared';
import { z } from 'zod';

export const registerSchema = z.object({
  body: z
    .object({
      email: z.email('Invalid email address').trim().toLowerCase(),
      password: z.string().trim().superRefine(validatePassword),
      confirmPassword: z.string(),

      phone: z.string().transform(validatePhone),
      firstName: z
        .string()
        .trim()
        .min(ParentValidationRules.NAME_MIN_LEN, 'First name required')
        .max(ParentValidationRules.NAME_MAX_LEN, 'No name more than 14 char')
        .regex(
          ParentValidationRules.NAME_REGEX,
          'First name contains non-alphabetic characters',
        ),
      lastName: z
        .string()
        .trim()
        .min(ParentValidationRules.NAME_MIN_LEN, 'Last name required')
        .max(ParentValidationRules.NAME_MAX_LEN, 'No name more than 14 char')
        .regex(
          ParentValidationRules.NAME_REGEX,
          'Last name contains non-alphabetic characters',
        ),
      birthDate: z.coerce.date().refine(
        (date) => {
          const today = new Date();
          return (
            today.getFullYear() - date.getFullYear() >=
            ParentValidationRules.MIN_AGE
          );
        },
        { message: 'The parent must older than 18 years old.' },
      ),
    })
    .superRefine(checkConfirmPassword),
});

export type RegisterBodyInput = z.infer<typeof registerSchema>['body'];

export const loginSchema = z.object({
  body: z.object({
    email: z.email('Invalid email format').trim().toLowerCase(),
    password: z.string().min(1, 'Password is required'),
  }),
});
export type LoginBodyInput = z.infer<typeof loginSchema>['body'];

export const forgetPasswordSchema = z.object({
  body: z.object({
    email: z.email('Invalid email format').trim().toLowerCase(),
  }),
});
export type ForgetPasswordBodyInput = z.infer<
  typeof forgetPasswordSchema
>['body'];

export const OTPSchema = z.object({
  body: z.object({
    email: z.email('Invalid email format').trim().toLowerCase(),
    reason: z.enum(otpReasonValues),
  }),
});
export type OTPBodyInput = z.infer<typeof OTPSchema>['body'];

export const VerifyOTPSchema = z.object({
  body: z.object({
    email: z.email('Invalid email format.').trim().toLowerCase(),
    otp: z.string('Invalid OTP.').length(6, 'OTP must be 6 digits.'),
    reason: z.enum(otpReasonValues),
  }),
});
export type VerifyOTPBodyInput = z.infer<typeof VerifyOTPSchema>['body'];

export const resetPasswordSchema = z.object({
  params: z.object({
    token: z.string('Invalid token.'),
  }),
  body: z.object({
    password: z.string().superRefine(validatePassword),
    confirmPassword: z.string(),
  }),
});
export type ResetPasswordBodyInput = z.infer<
  typeof resetPasswordSchema
>['body'];
export type ResetPasswordParamsInput = z.infer<
  typeof resetPasswordSchema
>['params'];

export const logoutSchema = z.object({});
export type LogoutInput = z.infer<typeof logoutSchema>['body'];
