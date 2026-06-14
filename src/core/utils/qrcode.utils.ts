import { HttpStatusCode } from '@anis/shared';
import QRCode from 'qrcode';

import AppError from './AppError.js';
import logger from './logger.js';

export const QrCode = {
  async generateBase64(data: Record<string, string> | string): Promise<string> {
    try {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      return await QRCode.toDataURL(payload, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 400,
      });
    } catch (error) {
      logger.error('Failed to generate QR Code', error);
      throw new AppError(
        'Could not generate pairing QR code',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
      );
    }
  },
};
