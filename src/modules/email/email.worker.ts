// import { redisQueueConnection } from '@/config/redis';
// import { emailService } from '@/core/handlers/email.handler';
// import { EmailJobData } from '@/core/queues/email.queue';
// import logger from '@/core/utils/logger';
// import { Job, Worker } from 'bullmq';

// export const setupEmailWorker = () => {
//   const worker = new Worker<EmailJobData>(
//     'email-queue',
//     async (job: Job) => {
//       logger.info(`Processing email job ${job.id} for ${job.data.to}`);

//       // Call your existing nodemailer logic
//       const success = await emailService.send(job.data);

//       if (!success) {
//         throw new Error('Email failed to send, triggering BullMQ retry');
//       }
//     },
//     { connection: redisQueueConnection },
//   );

//   worker.on('failed', (job, err) => {
//     logger.error(`Job ${job?.id} failed: ${err.message}`);
//   });

//   return worker;
// };
