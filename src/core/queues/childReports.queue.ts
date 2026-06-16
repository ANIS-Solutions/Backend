import { redisQueueConnection } from '@/config/redis';
import { Queue } from 'bullmq';

export interface ReportGenerationJobPayload {
  reportId: string;
  childId: string;
  sessionDocId: string;
}

export const childReportQueue = new Queue<ReportGenerationJobPayload>(
  'child-report-generation',
  {
    connection: redisQueueConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { age: 60 * 60 * 24, count: 200 },
      removeOnFail: { age: 60 * 60 * 24 * 7, count: 500 },
    },
  },
);

export const enqueueReportGeneration = async (
  payload: ReportGenerationJobPayload,
): Promise<void> => {
  await childReportQueue.add(`report_${payload.reportId}`, payload, {
    jobId: `report_${payload.reportId}`,
  });
};
