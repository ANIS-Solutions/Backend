import config from '@configs/base';
import rateLimit from 'express-rate-limit';

export const otpLimiter = rateLimit({
  windowMs: 60_0_000, // 10 M
  limit: config.IS_PROD_ENV ? 3 : 100,
  message: {
    status: 'fail',
    message: 'Too many OTP requests. Please try again in 10 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const otpVerifyLimiter = rateLimit({
  windowMs: 60_0_000,
  limit: config.IS_PROD_ENV ? 5 : 100,
  message: {
    status: 'fail',
    message: 'Too many verification attempts. Please wait.',
  },
});
