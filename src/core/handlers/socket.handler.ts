/**
 * Socket Handler — Central type re-exports for socket infrastructure.
 *
 * All modules should import socket types from here,
 * not directly from socket.io or ../../types/socket.
 */
import { Socket } from 'socket.io';

import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from '../../types/socket.js';

export type { TypedServer } from '../../socket.js';

/** Fully-typed Socket instance — single source of truth for all modules */
export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type {
  ClientToServerEvents,
  InterServerEvents,
  RTCIceCandidateInit,
  RTCSessionDescriptionInit,
  ServerToClientEvents,
  SocketData,
} from '../../types/socket.js';
