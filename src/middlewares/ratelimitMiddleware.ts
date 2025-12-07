import rateLimit from 'express-rate-limit';

export const otpLimiter = rateLimit({
  windowMs: 60_0_000, // 10 M
  limit: 3,
  message: {
    status: 'fail',
    message: 'Too many OTP requests. Please try again in 10 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const otpVerifyLimiter = rateLimit({
  windowMs: 60_0_000,
  limit: 5,
  message: {
    status: 'fail',
    message: 'Too many verification attempts. Please wait.',
  },
});
