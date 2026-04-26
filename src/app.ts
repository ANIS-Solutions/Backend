import { dirname } from 'path';
import { fileURLToPath } from 'url';

import routes from '@/api/apiRouter';
import config from '@/config/base';
import globalErrorHandler from '@/core/middleware/error.middleware';
import { limiter } from '@/core/middleware/ratelimit.middleware';
import { corsOptions } from '@/core/utils/cors.utils';
import logger from '@/core/utils/logger';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app: Application = express();

app.use(helmet());

app.use(cookieParser());

app.use(cors(corsOptions));

const morganStream = {
  write: (message: string): void => {
    logger.info(message.trim());
  },
};

if (config.IS_DEV_ENV) {
  app.use(morgan('dev', { stream: morganStream }));
  app.use((req, res, next) => {
    logger.info(`Method: ${req.method}`);
    logger.info(`URL: ${req.url}`);
    logger.info(`Query Params:`, req.query);
    logger.info(`Body:`, req.body);
    logger.info(`-----------------------------------`);
    next();
  });
}

if (config.IS_PROD_ENV) {
  app.use('/api', limiter);
}

app.use('/public', express.static(__dirname + '/public'));

app.use(express.json({ limit: '10kb' }));

app.use('/api/v1', routes);

app.use(globalErrorHandler);

export default app;
