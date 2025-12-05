import {
  login,
  // change_password,
  // forget_password,
  register,
  // logout,
  // refresh_token,
  // registerSchema,
  // reset_password,
  testOperation,
  // verify_email,
  // verify_otp,
} from '@controllers/authController';
import { authMiddleware } from '@middlewares/authMiddleware';
import { authValidate } from '@middlewares/validationMiddleware';
import { registerSchema } from '@schemas/authSchema';
import { Router } from 'express';

const authRouter = Router();

authRouter.post('/register', authValidate(registerSchema), register);
authRouter.post('/login', login);
// authRouter.get('/logout', logout);

// authRouter.post('/verify-otp', verify_otp);
// authRouter.get('/verify-otp', verify_otp);

// authRouter.get('/verify-email', verify_email);
// authRouter.post('/verify-email', verify_email);

// authRouter.patch('/change-password', change_password);
// authRouter.post('/forget-password', forget_password);
// authRouter.patch('/reset-password', reset_password);

// authRouter.post('/refresh-token', refresh_token);
authRouter.get('/test-operation', authMiddleware, testOperation);

export default authRouter;
