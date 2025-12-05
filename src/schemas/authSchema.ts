import { DiversityType, passwordStrength } from 'check-password-strength';
import { phone } from 'phone';
import { z } from 'zod';

export const registerSchema = z.object({
  body: z
    .object({
      email: z.email('Invalid email address').trim().toLowerCase(),
      password: z
        .string()
        // .min(8, 'Password must be at least 8 characters')
        .superRefine((password, ctx) => {
          const verdict = passwordStrength(password);

          const missing: string[] = [];
          ['lowercase', 'uppercase', 'number', 'symbol'].map((el) => {
            if (!verdict.contains.includes(el as DiversityType))
              missing.push(el);
          });

          const isStrong =
            !missing.length &&
            (verdict.length >= 8 ||
              ['Medium', 'Strong'].includes(verdict.value));
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
      confirmPassword: z.string(),

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
      }),
      firstName: z
        .string()
        .trim()
        .min(2, 'First name required')
        .max(14, 'No name more than 14 char')
        .regex(
          /^[\p{L}\s'-]+$/u, //! /^[a-zA-Z\s\-']+$/
          'First name contains non-alphabtic characters',
        ),
      lastName: z
        .string()
        .trim()
        .min(2, 'Last name required')
        .max(14, 'No name more than 14 char')
        .regex(
          /^[\p{L}\s'-]+$/u,
          'Last name contains non-alphabtic characters',
        ),

      birthDate: z.coerce.date().refine(
        (date) => {
          const today = new Date();
          return today.getFullYear() - date.getFullYear() >= 18;
        },
        { message: 'The parent must older than 18 years old.' },
      ),
    })
    .superRefine(({ confirmPassword, password }, ctx) => {
      if (confirmPassword !== password) {
        ctx.addIssue({
          code: 'custom',
          message: 'The passwords did not match',
          path: ['confirmPassword'],
        });
      }
    }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export const loginSchema = z.object({
  body: z.object({
    email: z.email('Invalid email format').trim().toLowerCase(),
    password: z.string().min(1, 'Password is required'),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>['body'];
