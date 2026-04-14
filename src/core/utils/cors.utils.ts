import config from '@/config/base';
import AppError from '@/core/utils/AppError';
import { HttpStatusCode } from '@anis/shared';
import { CorsOptions } from 'cors';

const allowedWebOrigins: (string | undefined)[] = [
  config.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'https://anis-backend.apidog.io',
];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedWebOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(
      new AppError(
        `CORS Error: The origin ${origin} is not authorized to access this API.`,
        HttpStatusCode.FORBIDDEN,
      ),
    );
  },

  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  // allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};
