import { DiversityType, passwordStrength } from 'check-password-strength';
import { phone } from 'phone';
import { z } from 'zod';
import { $RefinementCtx } from 'zod/v4/core';

// =============================== Schema's Utility ===============================

const otpReasons = z.literal(['register', 'deactivate']); // TODO: To be updated.

const validatePassword = (
  password: string,
  ctx: $RefinementCtx<string>,
): void => {
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
};

const validatePhone = (
  phone_number: string,
  ctx: $RefinementCtx<string>,
): string => {
  const ret = phone(phone_number);
  if (!ret.isValid) {
    ctx.addIssue({
      code: 'custom', //? z.ZodIssueCode.custom => Deprecated
      message: 'Invalid phone number',
    });
    return z.NEVER;
  }
  return ret.phoneNumber;
};
const checkConfirmPassword = (
  { password, confirmPassword }: { confirmPassword: string; password: string },
  ctx: $RefinementCtx,
): void => {
  if (confirmPassword !== password) {
    ctx.addIssue({
      code: 'custom',
      message: 'The passwords did not match',
      path: ['confirmPassword'],
    });
  }
};
// =============================== Routes Schema ===============================

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
        .min(2, 'First name required')
        .max(14, 'No name more than 14 char')
        .regex(
          /^[\p{L}\s'-]+$/u, //! /^[a-zA-Z\s\-']+$/
          'First name contains non-alphabetic characters',
        ),
      lastName: z
        .string()
        .trim()
        .min(2, 'Last name required')
        .max(14, 'No name more than 14 char')
        .regex(
          /^[\p{L}\s'-]+$/u,
          'Last name contains non-alphabetic characters',
        ),
      birthDate: z.coerce.date().refine(
        (date) => {
          const today = new Date();
          return today.getFullYear() - date.getFullYear() >= 18;
        },
        { message: 'The parent must older than 18 years old.' },
      ),
    })
    .superRefine(checkConfirmPassword),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];

export const loginSchema = z.object({
  body: z.object({
    email: z.email('Invalid email format').trim().toLowerCase(),
    password: z.string().min(1, 'Password is required'),
  }),
});
export type LoginInput = z.infer<typeof loginSchema>['body'];

export const forgetPasswordSchema = z.object({
  body: z.object({
    email: z.email('Invalid email format').trim().toLowerCase(),
  }),
});
export type ForgetPasswordInput = z.infer<typeof forgetPasswordSchema>['body'];

export const OTPSchema = z.object({
  body: z.object({
    email: z.email('Invalid email format').trim().toLowerCase(),
    reason: otpReasons,
  }),
});
export type OTPInput = z.infer<typeof OTPSchema>['body'];

export const VerifyOTPSchema = z.object({
  body: z.object({
    email: z.email('Invalid email format.').trim().toLowerCase(),
    otp: z.string('Invalid OTP.').length(6, 'OTP must be 6 digits.'),
    reason: otpReasons,
  }),
});
export type VerifyOTPInput = z.infer<typeof VerifyOTPSchema>['body'];

export const resetPasswordSchema = z.object({
  params: z.object({
    token: z.string('Invalid token.'),
  }),
  body: z.object({
    password: z.string().superRefine(validatePassword),
    confirmPassword: z.string(),
  }),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const deactivateAccountSchema = z.object({
  body: z.object({
    otp: z.string('Invalid OTP.').length(6, 'OTP must be 6 digits.'),
    reason: otpReasons,
  }),
});
export type DeactivateAccountInput = z.infer<
  typeof deactivateAccountSchema
>['body'];

export const logoutSchema = z.object({
  body: z.object({
    email: z.email('Invalid email format.').trim().toLowerCase(),
  }),
});
export type LogoutInput = z.infer<typeof logoutSchema>['body'];

export const changePasswordSchema = z.object({
  body: z
    .object({
      oldPassword: z.string(),
      password: z.string().trim().superRefine(validatePassword),
      confirmPassword: z.string(),
    })
    .superRefine(checkConfirmPassword),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
export const updateProfileSchema = z.object({
  body: z.object({
    email: z.email('Invalid email address').trim().toLowerCase().optional(),
    phone: z.string().transform(validatePhone).optional(),
    firstName: z
      .string()
      .trim()
      .min(2, 'First name required')
      .max(14, 'No name more than 14 char')
      .regex(
        /^[\p{L}\s'-]+$/u, //! /^[a-zA-Z\s\-']+$/
        'First name contains non-alphabetic characters',
      )
      .optional(),
    lastName: z
      .string()
      .trim()
      .min(2, 'Last name required')
      .max(14, 'No name more than 14 char')
      .regex(/^[\p{L}\s'-]+$/u, 'Last name contains non-alphabetic characters')
      .optional(),
    birthDate: z.coerce
      .date()
      .refine(
        (date) => {
          const today = new Date();
          return today.getFullYear() - date.getFullYear() >= 18;
        },
        { message: 'The parent must older than 18 years old.' },
      )
      .optional(),
  }),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
