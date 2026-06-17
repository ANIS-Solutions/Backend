export const CACHE = {
  TTL: {
    PAIRING_PENDING: 10 * 60,
    REPAIR_PENDING: 10 * 60,
  },
  PREFIX: {
    PAIRING_PENDING: 'pairing:pending:',
    REPAIR_PENDING: 'repair:pending:',
  },
} as const;
