import dbConnect from '@/config/db';
import logger from '@/core/utils/logger';
import { setupEmailWorker } from '@/modules/email/email.worker';
import { Worker } from 'bullmq';

import { setupChildSessionWorker } from './core/workers/childSessions.worker.js';
import { setupEmbeddingWorker } from './core/workers/embedding.worker.js';

const workers: Worker[] = [];

async function bootstrapWorkers(): Promise<void> {
  logger.info('[WORKER] Connecting to MongoDB...');
  await dbConnect();
  logger.info('[WORKER] MongoDB connected.');
  logger.info('[WORKER] Starting Background Workers...');

  const emailWorker = setupEmailWorker();
  const embeddingWorker = setupEmbeddingWorker();
  const childSessionWorker = setupChildSessionWorker();
  workers.push(emailWorker, embeddingWorker, childSessionWorker);
  logger.info('[WORKER] All workers are listening for jobs.');
}

// ── Graceful Shutdown ───────── ───────── ─────────
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(
    `[WORKER] Received ${signal}. Shutting down workers gracefully...`,
  );

  await Promise.allSettled(workers.map((w) => w.close()));

  logger.info('[WORKER] All workers closed. Exiting.');
  process.exit(0);
}

process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => void gracefulShutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  logger.error('[WORKER] Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  logger.error('[WORKER] Unhandled Rejection:', err);
  process.exit(1);
});

bootstrapWorkers().catch((err) => {
  logger.error('[WORKER] Failed to bootstrap workers:', err);
  process.exit(1);
});
