import { redisQueueConnection } from '@/config/redis';
import { IEmailOptions } from '@/core/handlers/email.handler';
import { Queue } from 'bullmq';

export const emailQueue = new Queue<IEmailOptions>('email-queue', {
  connection: redisQueueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { age: 60 * 60, count: 50 },
    removeOnFail: { age: 24 * 60 * 60, count: 1000 },
  },
});
