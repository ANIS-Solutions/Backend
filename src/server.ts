import config from '@/config/base';
import dbConnect from '@/config/db';
import {
  sigTermHandler,
  uncaughtExceptionHandler,
  unhandledRejectionHandler,
} from '@/core/handlers/server.handler';
import logger from '@/core/utils/logger';
import app from '@app';

import '@/modules/email/email.listener';

import http, { Server } from 'http';

import { initFirebase } from '@/config/firebase';

import { initializeWebSockets } from './socket.js';

process.on('uncaughtException', uncaughtExceptionHandler);

export let server: Server;

export const startServer = async (): Promise<void> => {
  try {
    await dbConnect();
    initFirebase();

    const httpServer = http.createServer(app);
    const io = initializeWebSockets(httpServer);
    app.set('io', io);

    server = httpServer;
    httpServer.listen(config.PORT, () => {
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
