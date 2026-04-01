import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

const verifyEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    process.exit(1);
    // throw new Error(`CRITICAL ERROR: Missing environment variable: ${key}.`);
  }
  return value.trim();
};

const config = {
  NODE_ENV: verifyEnvVar('NODE_ENV') || 'dev',
  IS_DEV_ENV: process.env.NODE_ENV?.trim() === 'dev',
  IS_TEST_ENV: process.env.NODE_ENV?.trim() === 'test',
  IS_PROD_ENV: process.env.NODE_ENV?.trim() === 'production',
  PORT: +process.env.PORT! || 3000,
  CLIENT_URL: 'http://localhost:3000',
  DATABASE: verifyEnvVar('DATABASE'),
  DATABASE_NAME: verifyEnvVar('DATABASE_NAME'),
  DATABASE_USERNAME: verifyEnvVar('DATABASE_USERNAME'),
  DATABASE_PASSWORD: verifyEnvVar('DATABASE_PASSWORD'),
  BCRYPT_SALT_ROUNDS: +verifyEnvVar('BCRYPT_SALT_ROUNDS'),
  JWT_SECRET: verifyEnvVar('JWT_SECRET'),
  JWT_EXPIRES_IN: verifyEnvVar('JWT_EXPIRES_IN'),
  JWT_REFRESH_EXPIRES_IN: verifyEnvVar('JWT_REFRESH_EXPIRES_IN'),
  OTP_EXPIRES_IN: +verifyEnvVar('OTP_EXPIRES_IN'),
  PASSWORD_RESET_TOKEN_EXPIRES: +verifyEnvVar('PASSWORD_RESET_TOKEN_EXPIRES'),
  JWT_COOKIE_EXPIRES_IN: verifyEnvVar('JWT_COOKIE_EXPIRES_IN'),
  EMAIL_USER: verifyEnvVar('EMAIL_USER'),
  EMAIL_PASSWORD: verifyEnvVar('EMAIL_PASSWORD'),
  EMAIL_HOST: verifyEnvVar('EMAIL_HOST'),
  EMAIL_SERVICE: verifyEnvVar('EMAIL_SERVICE'),
  EMAIL_PORT: +verifyEnvVar('EMAIL_PORT'),
  MAILTRAP_TOKEN: verifyEnvVar('MAILTRAP_TOKEN'),
  DEV_EMAIL_HOST: verifyEnvVar('DEV_EMAIL_HOST'),
  DEV_EMAIL_PORT: +verifyEnvVar('DEV_EMAIL_PORT'),
  DEV_EMAIL_USER: verifyEnvVar('DEV_EMAIL_USER'),
  DEV_EMAIL_PASSWORD: verifyEnvVar('DEV_EMAIL_PASSWORD'),
  REDIS_URL: verifyEnvVar('REDIS_URL'),
  REDIS_HOST: verifyEnvVar('REDIS_HOST'),
  REDIS_PORT: verifyEnvVar('REDIS_PORT'),
  REDIS_PASSWORD: verifyEnvVar('REDIS_PASSWORD'),
};

export default config;
