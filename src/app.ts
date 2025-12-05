import config from '@configs/base';
import globalErrorHandler from '@middlewares/errorMiddleware';
import routes from '@routes/base';
import logger from '@utils/logger';
import cors from 'cors';
import express, { Application } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

const app: Application = express();

app.use(helmet());

app.use(
  cors({
    origin: config.CLIENT_URL || `http://localhost:${config.PORT}`,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  }),
);
const morganStream = {
  write: (message: string): void => {
    logger.info(message.trim());
  },
};
if (config.IS_DEV_ENV) {
  app.use(morgan('dev', { stream: morganStream }));
}

const limiter = rateLimit({
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

app.use('/api', limiter);

app.use(express.json({ limit: '10kb' }));

app.use('/api/v1', routes);

app.use(globalErrorHandler);

export default app;
