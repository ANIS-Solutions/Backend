import fs from 'fs/promises';

import { redisQueueConnection } from '@/config/redis';
import { embeddingService } from '@/core/handlers/embeddingService.handler';
import { FCMService } from '@/core/utils/fcm.utils';
import { ChildModel } from '@/modules/child/child.model';
import { ChildReportModel } from '@/modules/childReports/childReports.model';
import { childSessionModel } from '@/modules/childSessions/childSessions.model';
import { ParentModel } from '@/modules/parent/parent.model';
import { FcmAction, NotificationType } from '@anis/shared';
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

  await ChildReportModel.updateOne(
    { _id: reportId },
    { generationStatus: 'processing' },
  );

  try {
    const session = await childSessionModel
      .findOne({ _id: sessionDocId, childId })
      .lean();

    if (!session) {
      throw new Error(`Session ${sessionDocId} not found for child ${childId}`);
    }

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

    const child = await ChildModel.findById(childId)
      .select('firstName parentId')
      .lean();
    if (child) {
      const parent = await ParentModel.findById(child.parentId)
        .select('devices')
        .lean();
      if (parent && parent.devices.length > 0) {
        const fcmTokens = parent.devices.map((d) => d.fcmToken);
        const { staleTokens } = await FCMService.sendMulticastNotification({
          recipientId: child.parentId.toString(),
          fcmTokens,
          title: 'Behavioral Report Ready',
          body: `A new behavioral report is ready for ${child.firstName}`,
          type: NotificationType.REPORT_READY,
          action: FcmAction.REPORT_READY,
          payload: { childId, reportId },
        });

        if (staleTokens.length > 0) {
          await FCMService.removeStaleFcmTokens(
            ParentModel,
            child.parentId.toString(),
            staleTokens,
          );
        }
      }
    }

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
    throw err;
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
