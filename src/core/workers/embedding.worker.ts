import { redisQueueConnection } from '@/config/redis';
import { PromptModel } from '@/modules/AiServices/embedding.model';
import { ChildModel } from '@/modules/child/child.model';
import { FcmAction } from '@anis/shared';
import { Job, Worker } from 'bullmq';

import { CacheService } from '../cache/cache.service.js';
import { embeddingService } from '../handlers/embeddingService.handler.js';
import { EmbeddingJobPayload } from '../queues/embeddingService.queue.js';
import { FCMService } from '../utils/fcm.utils.js';
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

    const updatedPrompt = await PromptModel.findByIdAndUpdate(
      promptId,
      {
        embedding: embeddings,
        embeddingStatus: 'done',
        embeddedAt: new Date(),
      },
      { new: true },
    ).lean();

    if (updatedPrompt) {
      const childId = updatedPrompt.childId.toString();
      let fcmToken = await CacheService.get(`fcm:child:${childId}`);
      if (!fcmToken) {
        const child = await ChildModel.findById(childId)
          .select('fcmToken')
          .lean();
        if (child?.fcmToken) {
          fcmToken = child.fcmToken;
          await CacheService.setWithTTL(
            `fcm:child:${childId}`,
            fcmToken,
            48 * 60 * 60,
          );
        }
      }

      if (fcmToken) {
        await FCMService.silentPush({
          fcmToken,
          action: FcmAction.SYNC_PROMPTS,
          payload: { promptId },
        });
      }
    }
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
