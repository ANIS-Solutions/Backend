import {
  change_password,
  deactivate_account,
  forget_password,
  generate_otp,
  login,
  register,
  reset_password,
  testOperation,
  update_profile,
  verify_otp,
} from '@controllers/authController';
import { authMiddleware } from '@middlewares/authMiddleware';
import { otpLimiter, otpVerifyLimiter } from '@middlewares/ratelimitMiddleware';
import { authValidate } from '@middlewares/validationMiddleware';
import {
  changePasswordSchema,
  deactivateAccountSchema,
  forgetPasswordSchema,
  loginSchema,
  OTPSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
  VerifyOTPSchema,
} from '@schemas/authSchema';
import { Router } from 'express';

const authRouter = Router();

authRouter.post('/register', authValidate(registerSchema), register);
authRouter.post('/login', authValidate(loginSchema), login);
// authRouter.get('/logout', logout);

authRouter.post(
  '/verify-email',
  authValidate(VerifyOTPSchema),
  otpLimiter,
  verify_otp,
);
authRouter.get(
  '/verify-email',
  authValidate(OTPSchema),
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
  authMiddleware,
  forget_password,
);

authRouter.patch(
  '/reset-password/:token',
  authValidate(resetPasswordSchema),
  reset_password,
);
// authRouter.post('/refresh-token', refresh_token);
authRouter.get('/test-operation', authMiddleware, testOperation);

export default authRouter;
