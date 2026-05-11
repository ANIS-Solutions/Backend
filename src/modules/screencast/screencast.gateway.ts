import type { TypedServer, TypedSocket } from '@/core/handlers/socket.handler';
import logger from '@/core/utils/logger';
import type { ServerToClientEvents } from '@/types/socket';

// ── Room ID Utility ───────────────────────────────────────────────────────────
// Single source of truth for room naming convention.
// Colon separator aligns with Socket.IO conventions and avoids collisions
// if childId itself contains underscores.
const screenRoomId = (childId: string): string => `screen:${childId}`;

// ── Relay Event Types ─────────────────────────────────────────────────────────
// Derive the relay-able event names and their payloads directly from
// ServerToClientEvents so this stays in sync automatically when the
// socket contract changes.
type WebRtcEvent = Extract<
  keyof ServerToClientEvents,
  'webrtc:offer' | 'webrtc:answer' | 'webrtc:ice-candidate'
>;
type WebRtcPayload<E extends WebRtcEvent> = Parameters<
  ServerToClientEvents[E]
>[0];

/**
 * Screencast WebRTC Signaling Gateway
 *
 * Responsibilities:
 * - Room lifecycle management (join / leave screen rooms)
 * - Opaque relay of WebRTC signaling messages (SDP offers/answers, ICE candidates)
 *
 * The server never inspects or modifies SDP/ICE payloads — it is a pure relay.
 * Actual video streams flow peer-to-peer via WebRTC, bypassing the server entirely.
 */
export const registerScreenCastHandlers = (
  io: TypedServer,
  socket: TypedSocket,
): void => {
  const user = socket.data.user;

  // ── Room Management ───────────────────────────────────────────────────────

  /**
   * Join the screencast signaling room for a specific child.
   * Both parent (viewer) and child (streamer) join the same room.
   */
  socket.on('screen:join', ({ childId }) => {
    const roomId = screenRoomId(childId);
    void socket.join(roomId);

    socket.to(roomId).emit('screen:user-joined', {
      role: user.role,
      userId: user.id,
    });

    logger.info(`[Screencast] ${user.role} ${user.id} joined room ${roomId}`);
  });

  /**
   * Leave the screencast room and notify remaining peers.
   * Uses io.to (broadcast to all) instead of socket.to (excludes sender)
   * so the leaving peer also receives the ended event before disconnecting.
   */
  socket.on('screen:leave', ({ childId }) => {
    const roomId = screenRoomId(childId);
    void socket.leave(roomId);
    io.to(roomId).emit('screen:ended');

    logger.info(`[Screencast] ${user.role} ${user.id} left room ${roomId}`);
  });

  // ── WebRTC Signaling Relay ────────────────────────────────────────────────
  // Pure relay handlers — forward SDP/ICE data opaquely to the other peer(s).
  // The relay helper below eliminates the repeated room-compute + emit + log
  // pattern that was duplicated across all three signal types.

  /**
   * Generic WebRTC signal relay.
   * Computes the room from childId, forwards the stripped payload to peers,
   * and logs the event type — all in one place.
   *
   * The generic parameter E ties the event name to its exact payload shape
   * via WebRtcPayload<E>, giving full compile-time safety at every call-site
   * without any casts.
   */
  const relaySignal = <E extends WebRtcEvent>(
    event: E,
    childId: string,
    payload: WebRtcPayload<E>,
  ): void => {
    const roomId = screenRoomId(childId);
    socket.to(roomId).emit(event, payload);
    logger.info(`[WebRTC] ${event} relayed in room ${roomId}`);
  };

  /** Relay SDP offer from parent (viewer) → child (streamer). */
  socket.on('webrtc:offer', ({ childId, sdp }) => {
    relaySignal('webrtc:offer', childId, { sdp });
  });

  /** Relay SDP answer from child (streamer) → parent (viewer). */
  socket.on('webrtc:answer', ({ childId, sdp }) => {
    relaySignal('webrtc:answer', childId, { sdp });
  });

  /**
   * Relay ICE candidates between peers.
   * Both parent and child emit ICE candidates; relay to the other party.
   */
  socket.on('webrtc:ice-candidate', ({ childId, candidate }) => {
    relaySignal('webrtc:ice-candidate', childId, { candidate });
  });
};
