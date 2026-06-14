import { redisQueueConnection } from '@/config/redis';
import { Queue } from 'bullmq';

export interface EmbeddingJobPayload {
  promptId: string;
  safeBaseline: string;
  activeThreats: Record<string, string>;
}

export const embeddingQueue = new Queue<EmbeddingJobPayload>(
  'embedding-service-queue',
  {
    connection: redisQueueConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { age: 60 * 60, count: 50 },
      removeOnFail: { age: 24 * 60 * 60, count: 1000 },
    },
  },
);

/**
 * Enqueues a prompt for (re-)embedding.
 * Deduplicates by promptId — if a job for this prompt is already
 * waiting/active, the old one is replaced with the latest data.
 */
export const enqueueEmbedding = async (
  payload: EmbeddingJobPayload,
): Promise<void> => {
  await embeddingQueue.add(
    `embed_${payload.promptId}`, // job name — for display/tracing
    payload,
    {
      jobId: `embed_${payload.promptId}`, // dedup key — one pending job per prompt
    },
  );
};
