import config from '@configs/base';
import dbConnect from '@configs/db';
import routes from '@routes/base';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();
app.use(helmet());
app.use(
  cors({
    origin: config.CLIENT_URL || `http://localhost:${config.PORT}`,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  }),
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

app.use(limiter);

/* eslint-disable no-console */
const startServer = async (): Promise<void> => {
  try {
    app.use(morgan('dev'));
    app.use(express.json());
    await dbConnect();
    app.use('/api/v1', routes);
    app.listen(config.PORT, () => {
      console.log(
        `-> START: Server Running: http://localhost:${config.PORT}/api/v1`,
      );
    });
  } catch (err) {
    console.log('-> FAILURE: Failed to start the server, ', err);
    process.exit(1);
  }
};

await startServer();

const handleServerShutdown = (): void => {
  try {
    console.log('-> SHUTDOWN: Server shutdown.');
    process.exit(0);
  } catch (err) {
    console.log('-> ERROR: Server shutdown with error, ', err);
    process.exit(1);
  }
};

process.on('SIGTERM', handleServerShutdown);
process.on('SIGINT', handleServerShutdown);
