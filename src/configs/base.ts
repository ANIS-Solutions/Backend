import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

const verifyEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`CRITICAL ERROR: Missing environment variable: ${key}.`);
  }
  return value;
};

const config = {
  PORT: +process.env.PORT! || 3000,
  CLIENT_URL: '',
  DATABASE: verifyEnvVar('DATABASE'),
  DATABASE_USERNAME: verifyEnvVar('DATABASE_USERNAME'),
  DATABASE_PASSWORD: verifyEnvVar('DATABASE_PASSWORD'),
  JWT_SECRET: verifyEnvVar('JWT_SECRET'),
  JWT_EXPIRES_IN: verifyEnvVar('JWT_EXPIRES_IN'),
  JWT_COOKIE_EXPIRES_IN: verifyEnvVar('JWT_COOKIE_EXPIRES_IN'),
  // EMAIL_USERNAME: verifyEnvVar('EMAIL_USERNAME'),
  // EMAIL_PASSWORD: verifyEnvVar('EMAIL_PASSWORD'),
  // EMAIL_HOST: verifyEnvVar('EMAIL_HOST'),
  // EMAIL_PORT: verifyEnvVar('EMAIL_PORT'),
  // EMAIL_FROM: verifyEnvVar('EMAIL_FROM'),
};

export default config;
