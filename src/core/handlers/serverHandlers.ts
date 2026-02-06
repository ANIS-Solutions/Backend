import { Server } from 'http';

import logger from '@core/utils/logger';

export const uncaughtExceptionHandler = (err: Error): void => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1);
};

export const unhandledRejectionHandler = (err: Error, server: Server): void => {
  logger.error('UNHANDLED REJECTION! Shutting down...');
  logger.error(err.name, err.message);

  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

export const sigTermHandler = (server: Server): void => {
  try {
    logger.info('\n-> SHUTDOWN: Server shutdown.');
    process.exit(0);
  } catch (err) {
    logger.error('\n-> ERROR: Server shutdown with error, ', err);
    if (server) {
      logger.info('[Hi] SIGTERM RECEIVED. Shutting down gracefully');
      server.close(() => {
        logger.info('[Stopped] Process terminated');
      });
    }
    process.exit(1);
  }
};
