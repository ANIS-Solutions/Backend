import crypto from 'crypto';
import path from 'path';

import { HttpStatusCode } from '@anis/shared';
import type { NextFunction, Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';

import AppError from '../utils/AppError.js';

// ─── Magic bytes map — validates actual file content, not just mimetype ────────
// Mimetype header is trivially spoofed; buffer signature is not.
const MAGIC_BYTES: Record<string, { bytes: number[]; offset?: number }> = {
  'image/jpeg': { bytes: [0xff, 0xd8, 0xff] },
  'image/png': { bytes: [0x89, 0x50, 0x4e, 0x47] },
  'image/webp': { bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF" header
};

type MulterFile = Express.Multer.File;

export function validateMagicBytes(buffer: Buffer, mimetype: string): boolean {
  const rule = MAGIC_BYTES[mimetype];
  if (!rule) return true;
  const offset = rule.offset ?? 0;
  return rule.bytes.every((byte, i) => buffer[offset + i] === byte);
}

export interface MulterConfig {
  allowedMimetypes: string[];
  maxFileSizeBytes?: number; // default 5MB
  maxFileCount?: number; // default 30
  fieldName?: string; // if set, only accept this field name
  storageMode?: 'memory' | 'disk'; // default 'disk'
  destination?: string; // disk mode only — default 'uploads/'
}

export function createMulterMiddleware(config: MulterConfig) {
  const {
    allowedMimetypes,
    maxFileSizeBytes = 5 * 1024 * 1024, // 5MB
    maxFileCount = 30,
    fieldName,
    storageMode = 'disk',
    destination = 'uploads/',
  } = config;

  const mimetypeSet = new Set(allowedMimetypes);

  // ── Extension whitelist per mimetype (secondary guard) ──────────────────────
  const mimeExtMap: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
  };

  const fileFilter = (
    _req: Request,
    file: MulterFile,
    cb: FileFilterCallback,
  ): void => {
    if (!mimetypeSet.has(file.mimetype)) {
      cb(
        new AppError(
          `File type '${file.mimetype}' is not allowed. Accepted: ${allowedMimetypes.join(', ')}`,
          HttpStatusCode.UNPROCESSABLE_ENTITY,
        ),
      );
      return;
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = mimeExtMap[file.mimetype] ?? [];
    if (allowedExts.length && !allowedExts.includes(ext)) {
      return cb(
        new AppError(
          `File extension '${ext}' does not match mimetype '${file.mimetype}'`,
          HttpStatusCode.UNPROCESSABLE_ENTITY,
        ),
      );
    }

    cb(null, true);
  };

  // ── Storage strategy ────────────────────────────────────────────────────────
  const storage =
    storageMode === 'disk'
      ? multer.diskStorage({
          destination: (_req, _file, cb) => cb(null, destination),
          filename: (_req, file, cb) => {
            // Unique prefix prevents overwrites from concurrent uploads
            const unique = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
            cb(null, `${unique}-${file.originalname}`);
          },
        })
      : multer.memoryStorage();

  const upload = multer({
    storage,
    limits: {
      fileSize: maxFileSizeBytes,
      files: maxFileCount,
    },
    fileFilter,
  });

  return fieldName ? upload.array(fieldName, maxFileCount) : upload.any();
}

export function validateUploadedFiles(
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const files = (_req.files ?? []) as Express.Multer.File[];

  for (const file of files) {
    // disk-mode files don't have buffer — read from path if needed
    // For disk mode, magic byte validation is skipped at middleware level;
    // the worker validates post-write. For memory mode, validate inline.
    if (file.buffer && !validateMagicBytes(file.buffer, file.mimetype)) {
      return next(
        new AppError(
          `File '${file.originalname}' content does not match its declared type '${file.mimetype}'. Possible spoofing attempt.`,
          HttpStatusCode.UNPROCESSABLE_ENTITY,
        ),
      );
    }
  }

  next();
}
