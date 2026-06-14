import { redisQueueConnection } from '@/config/redis';
import { PromptModel } from '@/modules/AiServices/embedding.model';
import { Job, Worker } from 'bullmq';

import { embeddingService } from '../handlers/embeddingService.handler.js';
import { EmbeddingJobPayload } from '../queues/embeddingService.queue.js';
import logger from '../utils/logger.js';

const processEmbeddingJob = async (
  job: Job<EmbeddingJobPayload>,
): Promise<void> => {
  const { promptId, safeBaseline, activeThreats } = job.data;

  await PromptModel.findByIdAndUpdate(promptId, {
    embeddingStatus: 'processing',
  });

  try {
    const embeddings = await embeddingService.generateEmbeddings(
      safeBaseline,
      activeThreats,
    );

    await PromptModel.findByIdAndUpdate(promptId, {
      embedding: embeddings,
      embeddingStatus: 'done',
      embeddedAt: new Date(),
    });
  } catch (err) {
    await PromptModel.findByIdAndUpdate(promptId, {
      embeddingStatus: 'failed',
    });
    throw err;
  }
};

export const setupEmbeddingWorker = (): Worker => {
  const worker = new Worker<EmbeddingJobPayload>(
    'embedding-service-queue',
    processEmbeddingJob,
    {
      connection: redisQueueConnection,
      concurrency: 3,
    },
  );

  worker.on('failed', (job, err) => {
    logger.error(
      `[EmbeddingWorker] Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`,
    );
  });

  return worker;
};
