import {
  checkConfirmPassword,
  otpReasonValues,
  validatePassword,
  validatePhone,
} from '@/core/utils/schema.utils';
import { ParentValidationRules } from '@anis/shared';
import z from 'zod';

export const deactivateAccountSchema = z.object({
  body: z.object({
    otp: z.string('Invalid OTP.').length(6, 'OTP must be 6 digits.'),
    reason: z.enum(otpReasonValues),
  }),
});
export type DeactivateAccountInput = z.infer<
  typeof deactivateAccountSchema
>['body'];

export const reactivateAccountRequestSchema = z.object({
  body: z.object({
    email: z.email('Invalid email format').trim().toLowerCase(),
  }),
});
export type ReactivateAccountRequestInput = z.infer<
  typeof reactivateAccountRequestSchema
>['body'];
export const reactivateAccountSchema = z.object({
  params: z.object({
    token: z.string('Invalid email format').trim(),
  }),
});
export type ReactivateAccountInput = z.infer<
  typeof reactivateAccountSchema
>['params'];

export const changePasswordSchema = z.object({
  body: z
    .object({
      oldPassword: z.string(),
      password: z.string().trim().superRefine(validatePassword),
      confirmPassword: z.string(),
    })
    .superRefine(checkConfirmPassword),
});
export type ChangePasswordBodyInput = z.infer<
  typeof changePasswordSchema
>['body'];

export const updateProfileSchema = z.object({
  body: z.object({
    email: z.email('Invalid email address').trim().toLowerCase().optional(),
    phone: z.string().transform(validatePhone).optional(),
    firstName: z
      .string()
      .trim()
      .min(ParentValidationRules.NAME_MIN_LEN, 'First name required')
      .max(ParentValidationRules.NAME_MAX_LEN, 'No name more than 14 char')
      .regex(
        ParentValidationRules.NAME_REGEX,
        'First name contains non-alphabetic characters',
      )
      .optional(),
    lastName: z
      .string()
      .trim()
      .min(ParentValidationRules.NAME_MIN_LEN, 'Last name required')
      .max(ParentValidationRules.NAME_MAX_LEN, 'No name more than 14 char')
      .regex(
        ParentValidationRules.NAME_REGEX,
        'Last name contains non-alphabetic characters',
      )
      .optional(),
    birthDate: z.coerce
      .date()
      .refine(
        (date) => {
          const today = new Date();
          return (
            today.getFullYear() - date.getFullYear() >=
            ParentValidationRules.MIN_AGE
          );
        },
        {
          message: `The parent must older than ${ParentValidationRules.MIN_AGE} years old.`,
        },
      )
      .optional(),
  }),
});
export type UpdateProfileBodyInput = z.infer<
  typeof updateProfileSchema
>['body'];
