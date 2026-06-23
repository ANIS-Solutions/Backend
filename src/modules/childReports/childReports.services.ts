import { enqueueReportGeneration } from '@/core/queues/childReports.queue';
import AppError from '@/core/utils/AppError';
import logger from '@/core/utils/logger';
import { childSessionModel } from '@/modules/childSessions/childSessions.model';
import { HttpStatusCode, type IActivityEntry } from '@anis/shared';

import { ChildReportModel } from './childReports.model.js';

interface ChildReportLean {
  _id: string;
  childId: string;
  parentId: string;
  sessionDocId: string;
  reportDate: Date;
  totalSessions: number;
  reportText: string | null;
  semanticSummary: string | null;
  activityDistribution: IActivityEntry[];
  generationStatus: string;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function requestReportGeneration(
  childId: string,
  parentId: string,
  sessionDocId: string,
): Promise<string> {
  const session = await childSessionModel
    .findOne({ _id: sessionDocId, childId })
    .lean();

  if (!session) {
    throw new AppError(
      'Child session not found or does not belong to this child.',
      HttpStatusCode.NOT_FOUND,
    );
  }

  const existing = await ChildReportModel.findOne({
    childId,
    sessionDocId,
  }).lean();

  if (existing) {
    if (
      existing.generationStatus === 'completed' ||
      existing.generationStatus === 'processing'
    ) {
      throw new AppError(
        `Report already ${existing.generationStatus} for this session.`,
        HttpStatusCode.CONFLICT,
      );
    }
    await ChildReportModel.updateOne(
      { _id: existing._id },
      { generationStatus: 'pending', errorMessage: null },
    );

    await enqueueReportGeneration({
      reportId: String(existing._id),
      childId,
      sessionDocId,
    });

    logger.info(
      `[ChildReports] Re-queued report ${String(existing._id)} for session ${sessionDocId}`,
    );
    return String(existing._id);
  }

  const report = await ChildReportModel.create({
    childId,
    parentId,
    sessionDocId,
    reportDate: session.reportDate,
    totalSessions: session.totalSessions,
    generationStatus: 'pending',
  });

  await enqueueReportGeneration({
    reportId: String(report._id),
    childId,
    sessionDocId,
  });

  logger.info(
    `[ChildReports] Queued report ${String(report._id)} for session ${sessionDocId}`,
  );

  return String(report._id);
}

export async function getChildReports(
  childId: string,
  limit = 10,
  page = 1,
): Promise<{
  reports: ChildReportLean[];
  total: number;
}> {
  const skip = (page - 1) * limit;

  const [reports, total] = await Promise.all([
    ChildReportModel.find({ childId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ChildReportModel.countDocuments({ childId }),
  ]);

  return { reports: reports as unknown as ChildReportLean[], total };
}

export async function getChildReportById(
  childId: string,
  reportId: string,
): Promise<ChildReportLean> {
  const report = await ChildReportModel.findOne({
    _id: reportId,
    childId,
  }).lean();

  if (!report) {
    throw new AppError('Report not found.', HttpStatusCode.NOT_FOUND);
  }

  return report as unknown as ChildReportLean;
}
