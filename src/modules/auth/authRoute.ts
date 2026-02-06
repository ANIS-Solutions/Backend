import { authMiddleware } from '@core/middlewares/authMiddleware';
import {
  otpLimiter,
  otpVerifyLimiter,
} from '@core/middlewares/ratelimitMiddleware';
import { authValidate } from '@core/middlewares/validationMiddleware';
import {
  changePasswordSchema,
  deactivateAccountSchema,
  forgetPasswordSchema,
  loginSchema,
  OTPSchema,
  reactivatePasswordSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
  VerifyOTPSchema,
} from '@modules/auth/authSchema';
import { Router } from 'express';

import {
  change_password,
  deactivate_account,
  forget_password,
  generate_otp,
  login,
  logout,
  reactivate_account,
  refresh_token,
  register,
  reset_password,
  testOperation,
  update_profile,
  verify_otp,
} from './authController.js';

const authRouter = Router();

authRouter.post('/register', authValidate(registerSchema), register);

authRouter.post('/login', authValidate(loginSchema), login);

authRouter.post(
  '/verify-email',
  authValidate(VerifyOTPSchema),
  otpLimiter,
  verify_otp,
);

authRouter.get(
  '/verify-email',
  authValidate(OTPSchema),
  authMiddleware,
  otpVerifyLimiter,
  generate_otp,
);

authRouter.patch(
  '/change-password',
  authValidate(changePasswordSchema),
  authMiddleware,
  change_password,
);

authRouter.patch(
  '/update-profile',
  authValidate(updateProfileSchema),
  authMiddleware,
  update_profile,
);

authRouter.get(
  '/deactivate',
  authValidate(OTPSchema),
  otpVerifyLimiter,
  generate_otp,
);

authRouter.delete(
  '/deactivate',
  authValidate(deactivateAccountSchema),
  authMiddleware,
  deactivate_account,
);

authRouter.post(
  '/forget-password',
  authValidate(forgetPasswordSchema),
  forget_password,
);

authRouter.post(
  '/reactivate',
  authValidate(reactivatePasswordSchema),
  reactivate_account,
);

authRouter.patch(
  '/reset-password/:token',
  authValidate(resetPasswordSchema),
  reset_password,
);

authRouter.get('/logout', logout);

authRouter.post('/refresh-token', refresh_token);

authRouter.get('/test-operation', authMiddleware, testOperation);

export default authRouter;
