// import { redisQueueConnection } from '@/config/redis';
// import { Queue } from 'bullmq';

// export interface EmailJobData {
//   to: string;
//   type: 'VERIFY_OTP' | 'RESET_PASSWORD';
//   data: Record<string, any>;
// }

// export const emailQueue = new Queue<EmailJobData>('email-queue', {
//   connection: redisQueueConnection,
//   defaultJobOptions: {
//     attempts: 3,
//     backoff: { type: 'exponential', delay: 1000 }, // Retry after 1s, 2s, 4s
//     removeOnComplete: true,
//   },
// });
