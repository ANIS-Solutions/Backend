import fs from 'fs/promises';
import path from 'path';

import { redisQueueConnection } from '@/config/redis';
import { childSessionModel } from '@/modules/childSessions/childSessions.model';
import { Job, Worker } from 'bullmq';

import { ChildSessionUploadJobPayload } from '../queues/childSessions.queue.js';
import logger from '../utils/logger.js';

async function moveFile(tempPath: string, targetPath: string): Promise<void> {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });

  try {
    await fs.rename(tempPath, targetPath);
  } catch {
    await fs.copyFile(tempPath, targetPath);
    await fs.unlink(tempPath);
  }
}
export async function deleteLocalFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
    logger.info(`[LocalStorage] Deleted: ${filePath}`);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return;
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`[LocalStorage] Delete failed [${filePath}]: ${message}`);
    throw err;
  }
}

export async function deleteLocalFiles(filePaths: string[]): Promise<void> {
  if (!filePaths.length) return;
  const results = await Promise.allSettled(filePaths.map(deleteLocalFile));
  const failures = results.filter((r) => r.status === 'rejected');
  if (failures.length) {
    logger.error(
      `[LocalStorage] Failed to delete ${failures.length}/${filePaths.length} files`,
    );
  } else {
    logger.info(
      `[LocalStorage] Deleted ${filePaths.length} files successfully`,
    );
  }
}

const processUploadJob = async (
  job: Job<ChildSessionUploadJobPayload>,
): Promise<void> => {
  const { docId, files } = job.data;

  logger.info(
    `[ChildSessionWorker] Processing job ${job.id}: ${files.length} files for doc ${docId}`,
  );

  const updateOps: { imageKey: string; imagePath: string }[] = [];

  for (const file of files) {
    await moveFile(file.tempPath, file.imageKey);
    updateOps.push({
      imageKey: file.imageKey,
      imagePath: file.imageKey,
    });
    logger.info(
      `[ChildSessionWorker] Moved: ${file.tempPath} → ${file.imageKey}`,
    );
  }

  for (const op of updateOps) {
    await childSessionModel.updateOne(
      { _id: docId, 'imageHighlights.imageKey': op.imageKey },
      { $set: { 'imageHighlights.$.imagePath': op.imagePath } },
    );
  }

  logger.info(
    `[ChildSessionWorker] Job ${job.id} complete: ${updateOps.length} files stored`,
  );
};

export const setupChildSessionWorker = (): Worker => {
  const worker = new Worker<ChildSessionUploadJobPayload>(
    'child-session-upload',
    processUploadJob,
    {
      connection: redisQueueConnection,
      concurrency: 2,
    },
  );

  worker.on('failed', (job, err) => {
    logger.error(
      `[ChildSessionWorker] Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`,
    );
  });

  worker.on('completed', (job) => {
    logger.info(`[ChildSessionWorker] Job ${job.id} completed successfully`);
  });

  return worker;
};
