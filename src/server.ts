import { Server } from 'http';

import app from '@app';
import config from '@config/base';
import dbConnect from '@config/db';
import {
  sigTermHandler,
  uncaughtExceptionHandler,
  unhandledRejectionHandler,
} from '@core/handlers/serverHandlers';
import logger from '@core/utils/logger';

process.on('uncaughtException', uncaughtExceptionHandler);

let server: Server;

const startServer = async (): Promise<void> => {
  try {
    await dbConnect();
    logger.info('-> DB Connected successfully');

    server = app.listen(config.PORT, () => {
      logger.info(
        `-> START: Server Running in ${config.NODE_ENV} mode on: http://localhost:${config.PORT}/api/v1`,
      );
    });
  } catch (err) {
    logger.error('-> FAILURE: Failed to connect to DB or start server', err);
    process.exit(1);
  }
};
void startServer();

process.on('unhandledRejection', (err: Error) => {
  unhandledRejectionHandler(err, server);
});

process.on('SIGTERM', () => sigTermHandler(server));
process.on('SIGINT', () => sigTermHandler(server));
