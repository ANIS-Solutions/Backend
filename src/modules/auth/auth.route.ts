import { authMiddleware } from '@/core/middleware/auth.middleware';
import {
  otpLimiter,
  otpVerifyLimiter,
} from '@/core/middleware/ratelimit.middleware';
import { reqValidate } from '@/core/middleware/validation.middleware';
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
} from '@/modules/auth/auth.schema';
import { API } from '@anis/shared';
import { Router } from 'express';

import {
  change_password,
  deactivate_account,
  forget_password,
  generate_otp,
  get_me,
  login,
  logout,
  reactivate_account,
  refresh_token,
  register,
  reset_password,
  update_profile,
  verify_otp,
} from './auth.controller.js';

const authRouter = Router();
const {
  REGISTER,
  LOGIN,
  ME,
  GENERATE_OTP,
  VERIFY_OTP,
  CHANGE_PASSWORD,
  UPDATE_PROFILE,
  DEACTIVATE,
  REACTIVATE,
  FORGET_PASSWORD,
  RESET_PASSWORD,
  LOGOUT,
  REFRESH_TOKEN,
} = API.PARENT.ROUTES;

authRouter[REGISTER.method](
  REGISTER.path,
  reqValidate(registerSchema),
  register,
);

authRouter[LOGIN.method](LOGIN.path, reqValidate(loginSchema), login);

authRouter[VERIFY_OTP.method](
  VERIFY_OTP.path,
  reqValidate(VerifyOTPSchema),
  otpVerifyLimiter,
  verify_otp,
);

authRouter[GENERATE_OTP.method](
  GENERATE_OTP.path,
  reqValidate(OTPSchema),
  // authMiddleware,
  otpLimiter,
  generate_otp,
);

authRouter[CHANGE_PASSWORD.method](
  CHANGE_PASSWORD.path,
  reqValidate(changePasswordSchema),
  authMiddleware,
  change_password,
);

authRouter[UPDATE_PROFILE.method](
  UPDATE_PROFILE.path,
  reqValidate(updateProfileSchema),
  authMiddleware,
  update_profile,
);

// authRouter.get(
//   '/deactivate',
//   reqValidate(OTPSchema),
//   otpVerifyLimiter,
//   generate_otp,
// );

authRouter[DEACTIVATE.method](
  DEACTIVATE.path,
  reqValidate(deactivateAccountSchema),
  authMiddleware,
  deactivate_account,
);

authRouter[FORGET_PASSWORD.method](
  FORGET_PASSWORD.path,
  reqValidate(forgetPasswordSchema),
  forget_password,
);

authRouter[REACTIVATE.method](
  REACTIVATE.path,
  reqValidate(reactivatePasswordSchema),
  reactivate_account,
);

authRouter[RESET_PASSWORD.method](
  RESET_PASSWORD.path,
  reqValidate(resetPasswordSchema),
  reset_password,
);

authRouter[LOGOUT.method](LOGOUT.path, authMiddleware, logout);

authRouter[REFRESH_TOKEN.method](REFRESH_TOKEN.path, refresh_token);

authRouter[ME.method](ME.path, authMiddleware, get_me);

// authRouter.get('/test-operation', authMiddleware, testOperation);

export default authRouter;
