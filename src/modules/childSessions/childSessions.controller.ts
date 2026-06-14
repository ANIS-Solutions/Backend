import ApiResponse from '@/core/handlers/api.handler';
import logger from '@/core/utils/logger';
import { HttpStatusCode } from '@anis/shared';
import type { NextFunction, Request, Response } from 'express';

import { UploadChildSessionsInput } from './childSessions.schema.js';
import { uploadChildSessionsService } from './childSessions.services.js';

export const uploadChildSessions = async (
  req: Request<{}, {}, UploadChildSessionsInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const childId = req.user!.id;

    const files = (req.files as Express.Multer.File[]) ?? [];

    logger.debug('─── [DEBUG] POST /child-session ───');
    logger.debug('  totalSessions:', req.body.totalSessions);
    logger.debug(
      '  image-highlights count:',
      Array.isArray(req.body['image-highlights'])
        ? req.body['image-highlights'].length
        : typeof req.body['image-highlights'],
    );
    logger.debug(
      '  list-of-embedding count:',
      Array.isArray(req.body['list-of-embedding'])
        ? req.body['list-of-embedding'].length
        : typeof req.body['list-of-embedding'],
    );
    logger.debug(`  uploaded files (${files.length}):`);
    for (const f of files) {
      logger.debug(
        `    - ${f.originalname} | path=${f.path} | mime=${f.mimetype} | size=${f.size}`,
      );
    }
    logger.debug('───────────────────────────────────');

    const result = await uploadChildSessionsService(childId, req.body, files);
    ApiResponse.success(
      res,
      HttpStatusCode.CREATED,
      `Session highlights uploaded successfully!`,
      { data: result },
    );
  } catch (err) {
    next(err);
  }
};
