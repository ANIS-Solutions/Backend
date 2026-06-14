import crypto from 'crypto';

import config from '@/config/base';
import bcrypt from 'bcryptjs';

export const AuthUtils = {
  generateCryptoUUID(): { token: string } {
    const token = crypto.randomUUID();
    return { token };
  },
  generateCryptoToken(): { token: string; hashedToken: string } {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    return { token, hashedToken };
  },
  hashCryptoToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  },
  async generateOTP(): Promise<{ otp: string; hashOtp: string }> {
    const otp = crypto.randomInt(100_000, 999_999).toString();
    const salt = await bcrypt.genSalt(config.BCRYPT_SALT_ROUNDS);
    const hashOtp = await bcrypt.hash(otp, salt);
    // config.OTP_EXPIRES_IN * 60_000
    return { otp, hashOtp };
  },
  async verifyOTP(candidateOTP: string, hashedOtp: string): Promise<boolean> {
    return bcrypt.compare(candidateOTP, hashedOtp);
  },
  async verifyPassword(
    candidatePassword: string,
    hash: string,
  ): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, hash);
  },
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(config.BCRYPT_SALT_ROUNDS);
    return bcrypt.hash(password, salt);
  },

  isPasswordChangedAfterAccessTokenIAT(
    createdAt: Date,
    passwordChangedAt: Date,
    iatJWT_Timestamp: number,
  ): boolean {
    if (createdAt.getTime() === passwordChangedAt.getTime()) {
      return false;
    }
    return !(
      parseInt(`${passwordChangedAt.getTime() / 1000}`, 10) <= iatJWT_Timestamp
    );
    // return parseInt(`${passwordChangedAt.getTime() / 1000}`, 10) < iatJWT_Timestamp;
  },
  isUnPairedAfterAccessTokenIAT(
    tokenInfo: { isActive: boolean; deviceId: string },
    chidInfo: { isActive: boolean; deviceId: string },
  ): boolean {
    return (
      tokenInfo.isActive !== chidInfo.isActive ||
      tokenInfo.deviceId !== chidInfo.deviceId
    );
  },
};
