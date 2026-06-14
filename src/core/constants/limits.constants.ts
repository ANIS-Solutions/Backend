export const LIMITS = {
  // RATE: {
  //   GLOBAL_WINDOW_MS: 60_000,
  //   GLOBAL_MAX: 100,
  //   AUTH_WINDOW_MS: 15 * 60_000,
  //   AUTH_MAX: 10, // stricter for login/otp
  //   OTP_WINDOW_MS: 60_000,
  //   OTP_MAX: 3,
  // },
  // CHILD: {
  //   MAX_PER_PARENT: 5,
  //   MAX_APPS_PER_SYNC: 500, // guard against huge payloads
  // },
  // SCREENCAST: {
  //   MAX_ROOM_DURATION_MS: 2 * 60 * 60 * 1000, // 2 hours
  // },
  // LOCATION: {
  //   TRACKING_INTERVAL_MS: 30_000,
  //   MAX_HISTORY_DAYS: 30,
  // },
} as const;
