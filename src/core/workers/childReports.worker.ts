import fs from 'fs/promises';

import { redisQueueConnection } from '@/config/redis';
import { embeddingService } from '@/core/handlers/embeddingService.handler';
import { ChildReportModel } from '@/modules/childReports/childReports.model';
import { childSessionModel } from '@/modules/childSessions/childSessions.model';
import { Job, Worker } from 'bullmq';

import type { ReportGenerationJobPayload } from '../queues/childReports.queue.js';
import logger from '../utils/logger.js';

const processReportJob = async (
  job: Job<ReportGenerationJobPayload>,
): Promise<void> => {
  const { reportId, childId, sessionDocId } = job.data;

  logger.info(
    `[ReportWorker] Processing job ${job.id}: report=${reportId} session=${sessionDocId}`,
  );

  // 1. Mark as processing
  await ChildReportModel.updateOne(
    { _id: reportId },
    { generationStatus: 'processing' },
  );

  try {
    // 2. Load the session document
    const session = await childSessionModel
      .findOne({ _id: sessionDocId, childId })
      .lean();

    if (!session) {
      throw new Error(`Session ${sessionDocId} not found for child ${childId}`);
    }

    // 3. Collect image file paths for highlights that have images stored
    const imageFiles: { path: string; filename: string }[] = [];
    for (const highlight of session.imageHighlights) {
      if (highlight.imagePath) {
        try {
          await fs.access(highlight.imagePath);
          const filename = `image_${highlight.resultId}_${highlight.sessionId}.png`;
          imageFiles.push({ path: highlight.imagePath, filename });
        } catch {
          logger.warn(`[ReportWorker] Image not found: ${highlight.imagePath}`);
        }
      }
    }

    // 4. Call FastAPI /report endpoint
    const result = await embeddingService.generateReport({
      childId,
      totalSessions: session.totalSessions,
      sessionEmbeddings: session.sessionEmbeddings,
      imageHighlights: session.imageHighlights.map((h) => ({
        resultId: h.resultId,
        sessionId: h.sessionId,
        timestamp: h.timestamp.getTime(),
        embedding: h.embedding,
      })),
      images: imageFiles,
    });

    // 5. Store the result
    await ChildReportModel.updateOne(
      { _id: reportId },
      {
        generationStatus: 'completed',
        reportText: result.reportText,
        semanticSummary: result.semanticSummary,
        activityDistribution: result.activityDistribution,
        errorMessage: null,
      },
    );

    logger.info(`[ReportWorker] Report ${reportId} completed successfully`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    await ChildReportModel.updateOne(
      { _id: reportId },
      {
        generationStatus: 'failed',
        errorMessage: message,
      },
    );

    logger.error(`[ReportWorker] Report ${reportId} failed: ${message}`);
    throw err; // Re-throw for BullMQ retry
  }
};

export const setupChildReportWorker = (): Worker => {
  const worker = new Worker<ReportGenerationJobPayload>(
    'child-report-generation',
    processReportJob,
    {
      connection: redisQueueConnection,
      concurrency: 2,
    },
  );

  worker.on('failed', (job, err) => {
    logger.error(
      `[ReportWorker] Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`,
    );
  });

  worker.on('completed', (job) => {
    logger.info(`[ReportWorker] Job ${job.id} completed successfully`);
  });

  return worker;
};
