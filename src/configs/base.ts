import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

const verifyEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`CRITICAL ERROR: Missing environment variable: ${key}.`);
  }
  return value.trim();
};

const config = {
  NODE_ENV: verifyEnvVar('NODE_ENV'),
  IS_DEV_ENV: process.env.NODE_ENV?.trim() === 'dev',
  IS_PROD_ENV: process.env.NODE_ENV?.trim() === 'production',
  PORT: +process.env.PORT! || 3000,
  CLIENT_URL: '',
  DATABASE: verifyEnvVar('DATABASE'),
  BCRYPT_SALT_ROUNDS: +verifyEnvVar('BCRYPT_SALT_ROUNDS'),
  DATABASE_USERNAME: verifyEnvVar('DATABASE_USERNAME'),
  DATABASE_PASSWORD: verifyEnvVar('DATABASE_PASSWORD'),
  JWT_SECRET: verifyEnvVar('JWT_SECRET'),
  JWT_EXPIRES_IN: verifyEnvVar('JWT_EXPIRES_IN'),
  JWT_REFRESH_EXPIRES_IN: verifyEnvVar('JWT_REFRESH_EXPIRES_IN'),
  OTP_EXPIRES_IN: +verifyEnvVar('OTP_EXPIRES_IN'),
  PASSWORD_RESET_TOKEN_EXPIRES: +verifyEnvVar('PASSWORD_RESET_TOKEN_EXPIRES'),
  JWT_COOKIE_EXPIRES_IN: verifyEnvVar('JWT_COOKIE_EXPIRES_IN'),
  // EMAIL_USERNAME: verifyEnvVar('EMAIL_USERNAME'),
  // EMAIL_PASSWORD: verifyEnvVar('EMAIL_PASSWORD'),
  // EMAIL_HOST: verifyEnvVar('EMAIL_HOST'),
  // EMAIL_PORT: verifyEnvVar('EMAIL_PORT'),
  // EMAIL_FROM: verifyEnvVar('EMAIL_FROM'),
};

export default config;
