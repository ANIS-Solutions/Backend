import {
  // change_password,
  forget_password,
  generate_otp,
  login,
  register,
  // logout,
  // refresh_token,
  // registerSchema,
  reset_password,
  testOperation,
  // verify_email,
  verify_otp,
} from '@controllers/authController';
import { authMiddleware } from '@middlewares/authMiddleware';
import { otpLimiter, otpVerifyLimiter } from '@middlewares/ratelimitMiddleware';
import { authValidate } from '@middlewares/validationMiddleware';
import {
  forgetPasswordSchema,
  OTPSchema,
  registerSchema,
  resetPasswordSchema,
  VerifyOTPSchema,
} from '@schemas/authSchema';
import { Router } from 'express';

const authRouter = Router();

authRouter.post('/register', authValidate(registerSchema), register);
authRouter.post('/login', login);
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

// authRouter.get('/verify-email', verify_email);
// authRouter.post('/verify-email', verify_email);

// authRouter.patch('/change-password', change_password);
authRouter.post(
  '/forget-password',
  authValidate(forgetPasswordSchema),
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
