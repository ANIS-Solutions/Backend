import { Server as HttpServer } from 'http';

import { socketAuthMiddleware } from '@/core/middleware/socket.auth.middleware';
import { Server } from 'socket.io';

import logger from './core/utils/logger.js';
import { registerScreenCastHandlers } from './modules/screencast/screencast.gateway.js';
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from './types/socket.js';

export type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export const initializeWebSockets = (httpServer: HttpServer): TypedServer => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  }) as TypedServer;

  io.use((socket, next) => {
    socketAuthMiddleware(socket, next).catch((err: unknown) => {
      next(err instanceof Error ? err : new Error('Unknown Socket Error'));
    });
  });

  // ── Connection handler ──
  io.on('connection', (socket) => {
    const user = socket.data.user;
    logger.info(
      `C] Client connected: [${user.role}] ${user.id} (Socket: ${socket.id})`,
    );

    // Register feature-specific event handlers
    registerScreenCastHandlers(io, socket);

    socket.on('disconnect', () => {
      logger.info(`X] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};
