import rateLimit from 'express-rate-limit';

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message:
      'Too many requests from this IP, please try again after 15 minutes',
  },
});
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
