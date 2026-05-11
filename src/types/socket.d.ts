import { IJwtPayload, UserRole } from '@anis/shared';

// ─── WebRTC Signaling Types ──────────────────────────────────────────────────
// Lightweight payload types — mirrors browser WebRTC API shapes.
// No external dependencies needed.

export interface RTCSessionDescriptionInit {
  type: 'offer' | 'answer';
  sdp: string;
}

export interface RTCIceCandidateInit {
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
}

// ─── Socket.IO Typed Events ─────────────────────────────────────────────────
// Passed as generic parameters to Server<> and Socket<> for full type-safety.

/** Events sent from client → server */
export interface ClientToServerEvents {
  // ── Screencast signaling ──
  'screen:join': (payload: { childId: string }) => void;
  'screen:leave': (payload: { childId: string }) => void;

  // ── WebRTC signaling ──
  'webrtc:offer': (payload: {
    childId: string;
    sdp: RTCSessionDescriptionInit;
  }) => void;
  'webrtc:answer': (payload: {
    childId: string;
    sdp: RTCSessionDescriptionInit;
  }) => void;
  'webrtc:ice-candidate': (payload: {
    childId: string;
    candidate: RTCIceCandidateInit;
  }) => void;
}

/** Events sent from server → client */
export interface ServerToClientEvents {
  // ── Screencast signaling ──
  'screen:user-joined': (payload: { role: UserRole; userId: string }) => void;
  'screen:ended': () => void;

  // ── WebRTC signaling ──
  'webrtc:offer': (payload: { sdp: RTCSessionDescriptionInit }) => void;
  'webrtc:answer': (payload: { sdp: RTCSessionDescriptionInit }) => void;
  'webrtc:ice-candidate': (payload: { candidate: RTCIceCandidateInit }) => void;

  // ── Errors ──
  'screen:error': (message: string) => void;
}

/** Events for inter-server communication (unused for now) */
export interface InterServerEvents {}

/** Additional properties attached to socket.data */
export interface SocketData {
  user: IJwtPayload;
}
