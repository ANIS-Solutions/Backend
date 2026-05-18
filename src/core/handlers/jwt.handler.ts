import config from '@/config/base';
import { IJwtPayload } from '@anis/shared';
import jwt, { JwtPayload, SignOptions, VerifyOptions } from 'jsonwebtoken';

export type TokenPayload = Record<string, unknown>;
export interface M2MTokenPayload {
  sub: string;
  svc: string;
  iat?: number;
  exp?: number;
}
/**
 * Generates a new JWT Access Token
 * @param payload - The data to encode (e.g., { userId: '...' })
 * @param expiresIn - Expiration string (e.g., '15m', '7d'). Defaults to config.
 */
export const signAccessToken = (
  payload: TokenPayload,
  expiresIn: string = config.JWT_EXPIRES_IN,
): string => {
  const options: SignOptions = { expiresIn } as SignOptions;
  return jwt.sign(payload, config.JWT_SECRET, options);
};

/**
 * Generates a Refresh Token (usually longer lived)
 * @param payload - The data to encode (e.g., { userId: '...' })
 * @param expiresIn - Expiration string (e.g., '15m', '7d'). Defaults to config.
 */
export const signRefreshToken = (
  payload: TokenPayload,
  expiresIn: string = config.JWT_REFRESH_EXPIRES_IN,
): string => {
  const options: SignOptions = { expiresIn } as SignOptions;
  return jwt.sign(payload, config.JWT_SECRET, options);
};

/**
 * Verifies a token and returns the payload if valid, or null if invalid/expired.
 * This prevents try/catch hell in your controllers.
 * @param token - The data to encode (e.g., { userId: '...' })
 * @param token - Expiration string (e.g., '15m', '7d'). Defaults to config.
 */
export const verifyToken = <T = jwt.JwtPayload & IJwtPayload>(
  token: string,
  options?: VerifyOptions,
): T | null => {
  try {
    return jwt.verify(token, config.JWT_SECRET, options) as T;
  } catch {
    return null;
  }
};

/**
 * Rotates a token: Verifies an old token and creates a fresh one with the same data.
 * Useful if you want to refresh an access token using an old valid one.
 * @param oldToken - The old token.
 * @param expiresIn - Expiration string (e.g., '15m', '7d'). Defaults to config.
 */
export const rotateToken = (
  oldToken: string,
  expiresIn?: string,
): string | null => {
  const decoded = verifyToken<JwtPayload>(oldToken);

  if (!decoded) return null;
  const { iat, exp, nbf, jti, ...cleanPayload } = decoded;
  return signAccessToken(cleanPayload, expiresIn);
};

/**
 * Signs a short-lived M2M token for internal service-to-service calls.
 * Uses the same JWT_SECRET - no separate secret needed.
 */
export const signM2MToken = (
  callerService: string,
  targetService: string,
  expiresIn: string = config.JWT_M2M_EXPIRES_IN,
): string => {
  const payload: M2MTokenPayload = {
    sub: callerService,
    svc: targetService,
  };

  const options: SignOptions = { expiresIn } as SignOptions;
  return jwt.sign(payload, config.JWT_M2M_SECRET, options);
};

/**
 * Verifies an incoming M2M token.
 * Validates both signature and that `svc` matches the expected target.
 * Returns the payload or null - never throws.
 */
export const verifyM2MToken = (
  token: string,
  expectedTargetService: string,
): M2MTokenPayload | null => {
  const decoded = verifyToken<M2MTokenPayload>(token);

  if (!decoded) return null;
  if (decoded.svc !== expectedTargetService) return null;

  return decoded;
};
