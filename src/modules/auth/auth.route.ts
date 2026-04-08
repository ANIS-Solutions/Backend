import {
  otpLimiter,
  otpVerifyLimiter,
} from '@/core/middleware/ratelimit.middleware';
import bindRoute from '@/core/utils/routeBounder';
import {
  forgetPasswordSchema,
  loginSchema,
  OTPSchema,
  registerSchema,
  resetPasswordSchema,
  VerifyOTPSchema,
} from '@/modules/auth/auth.schema';
import { API } from '@anis/shared';
import { Router } from 'express';

import {
  forget_password,
  generate_otp,
  login,
  logout,
  refresh_token,
  register,
  reset_password,
  verify_otp,
} from './auth.controller.js';

const authRouter = Router();

const {
  REGISTER,
  LOGIN,
  GENERATE_OTP,
  VERIFY_OTP,
  FORGET_PASSWORD,
  RESET_PASSWORD,
  LOGOUT,
  REFRESH_TOKEN,
} = API.AUTH.ROUTES;

// ─── PUBLIC ROUTES ────────────────────────────────────────────────────────
bindRoute(authRouter, REGISTER, register, registerSchema);
bindRoute(authRouter, LOGIN, login, loginSchema);
bindRoute(authRouter, FORGET_PASSWORD, forget_password, forgetPasswordSchema);
bindRoute(authRouter, RESET_PASSWORD, reset_password, resetPasswordSchema);
bindRoute(authRouter, REFRESH_TOKEN, refresh_token);

// ─── RATE-LIMITED ROUTES ──────────────────────────────────────────────────
bindRoute(authRouter, GENERATE_OTP, generate_otp, OTPSchema, otpLimiter);
bindRoute(
  authRouter,
  VERIFY_OTP,
  verify_otp,
  VerifyOTPSchema,
  otpVerifyLimiter,
);

// ─── PROTECTED ROUTES  ──────────────────────────
bindRoute(authRouter, LOGOUT, logout);

export default authRouter;
