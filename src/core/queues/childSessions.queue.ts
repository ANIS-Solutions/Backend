import { redisQueueConnection } from '@/config/redis';
import { Queue } from 'bullmq';

export const childSessionUploadQueue = new Queue('child-session-upload', {
  connection: redisQueueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: { age: 60 * 60, count: 100 },
    removeOnFail: { age: 24 * 60 * 60, count: 200 },
  },
});

export interface ChildSessionUploadJobPayload {
  docId: string;
  childId: string;
  files: {
    resultId: number;
    sessionId: number;
    tempPath: string;
    imageKey: string;
    mimetype: string;
  }[];
}

export interface FastApiDispatchJobPayload {
  docIds: string[];
}

export const enqueueChildSessionUpload = async (
  payload: ChildSessionUploadJobPayload,
): Promise<void> => {
  await childSessionUploadQueue.add(`upload_${payload.docId}`, payload, {
    jobId: `upload_${payload.docId}`,
  });
};
