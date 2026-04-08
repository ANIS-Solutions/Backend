import logger from '@/core/utils/logger';
import { setupEmailWorker } from '@/modules/email/email.worker';
import { Worker } from 'bullmq';

const workers: Worker[] = [];

async function bootstrapWorkers(): Promise<void> {
  logger.info('[WORKER] Starting Background Workers...');

  const emailWorker = setupEmailWorker();
  workers.push(emailWorker);

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
