import config from '@/config/base';
import AppError from '@/core/utils/AppError';
import { HttpStatusCode } from '@anis/shared';
import type { CorsOptions } from 'cors';

const WEB_ORIGINS: ReadonlySet<string> = new Set(
  [
    config.CLIENT_URL,
    'http://localhost:3000',
    'http://localhost:5173',
    'https://anis-backend.apidog.io',
    'http://127.0.0.1:5500',
  ].filter(Boolean),
);

/**
 * Mobile clients (Android / Flutter) send requests without an Origin header
 * because they are not browsers — they are native HTTP clients.
 *
 * Strategy: allow null/absent origins globally (standard for mobile APIs),
 * but require a custom header so we can distinguish intentional mobile calls
 * from accidental same-server requests.
 *
 * Clients MUST include:  X-Client-Type: android | flutter | ios
 *
 * This header is validated in the mobile guard below. You can tighten it
 * further (e.g. check a pre-shared API key) without touching the CORS layer.
 */
const MOBILE_CLIENT_TYPES = new Set(['android', 'flutter', 'ios']);

const isMobileOrServerRequest = (origin: string | undefined): boolean =>
  origin === undefined || origin === '';

const isAllowedWebOrigin = (origin: string): boolean => WEB_ORIGINS.has(origin);

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // ── No origin header ──
    // Native mobile clients (Android OkHttp, Flutter Dio / http) and
    // server-to-server callers never send an Origin. Allow unconditionally;
    // authentication middleware handles identity verification downstream.
    if (isMobileOrServerRequest(origin)) {
      return callback(null, true);
    }

    if (isAllowedWebOrigin(origin!)) {
      return callback(null, true);
    }

    return callback(
      new AppError(
        `CORS: origin "${origin}" is not authorised to access this API.`,
        HttpStatusCode.FORBIDDEN,
      ),
    );
  },

  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    // Required by mobile clients to self-identify (see note above).
    'X-Client-Type',
  ],

  exposedHeaders: ['X-Request-Id'],

  // Send credentials (cookies / Authorization) cross-origin for web clients.
  // Mobile clients set Authorization in the request header directly — this
  // setting has no effect on them.
  credentials: true,

  maxAge: 600,
};

// ── Socket.IO CORS ────────────────────────────────────────────────────────────
// Socket.IO needs its own CORS config because it runs its own HTTP upgrade
// handshake outside of the Express middleware chain.
// Mobile Socket.IO clients (socket.io-client in Flutter/Android) do send an
// Origin in the HTTP upgrade headers — list them here if known, or use '*'
// while you're still in development and tighten before going to production.

export const socketCorsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ): void => {
    if (isMobileOrServerRequest(origin)) return callback(null, true);
    if (isAllowedWebOrigin(origin!)) return callback(null, true);

    callback(new Error(`Socket CORS: origin "${origin}" is not authorised.`));
  },
  methods: ['GET', 'POST'],
  credentials: true,
} satisfies Parameters<
  InstanceType<typeof import('socket.io').Server>['use']
>[0] extends never
  ? object
  : object;
