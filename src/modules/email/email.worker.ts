import { redisQueueConnection } from '@/config/redis';
import { emailService, IEmailOptions } from '@/core/handlers/email.handler';
import logger from '@/core/utils/logger';
import { Job, Worker } from 'bullmq';

export const setupEmailWorker = (): Worker<IEmailOptions> => {
  const worker = new Worker<IEmailOptions>(
    'email-queue',
    async (job: Job<IEmailOptions>) => {
      logger.info(
        `[EMAIL_WORKER] Processing job ${job.id} -> ${job.data.to} [${job.data.type}]`,
      );

      await emailService.send(job.data);

      logger.info(`[EMAIL_WORKER] Job ${job.id} completed.`);
    },
    { connection: redisQueueConnection },
  );

  worker.on('failed', (job, err) => {
    logger.error(`[EMAIL_WORKER] Job ${job?.id} failed: ${err.message}`);
  });

  worker.on('error', (err) => {
    logger.error('[EMAIL_WORKER] Worker error:', err);
  });

  return worker;
};
