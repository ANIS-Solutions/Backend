import { emailReasons } from '@anis/shared';
import { DiversityType, passwordStrength } from 'check-password-strength';
import { phone } from 'phone';
import z, { RefinementCtx } from 'zod';

export const otpReasonValues = Object.values(emailReasons);

export const validatePassword = (
  password: string,
  ctx: RefinementCtx<string>,
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

export const validatePhone = (
  phone_number: string,
  ctx: RefinementCtx<string>,
): string => {
  const ret = phone(phone_number);
  if (!ret.isValid) {
    ctx.addIssue({
      code: 'custom',
      message: 'Invalid phone number',
    });
    return z.NEVER;
  }
  return ret.phoneNumber;
};

export const checkConfirmPassword = (
  { password, confirmPassword }: { confirmPassword: string; password: string },
  ctx: RefinementCtx,
): void => {
  if (confirmPassword !== password) {
    ctx.addIssue({
      code: 'custom',
      message: 'The passwords did not match',
      path: ['confirmPassword'],
    });
  }
};
