import { catchAsync } from '@/core/utils/catchAsync';
import { HttpStatusCode } from '@anis/shared';
import { NextFunction, Request, Response } from 'express';

import { ReportModel } from './report.model.js';
import { GenerateReportInput, GetReportsInput } from './report.schema.js';

export const generateReport = catchAsync(
  async (
    req: Request<{}, {}, GenerateReportInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const { report, childId } = req.body; // TODO: Auth special for FastAPI Services, for now use User Auth.
    const parentID = req.user!.id;

    const newReport = await ReportModel.create({
      child: childId,
      parent: parentID, // FIXME:
      content: report,
    });
    return res.status(HttpStatusCode.CREATED).json({
      success: true,
      message: 'Report stored successfully',
      data: { reportId: newReport._id },
    });
  },
);

export const getReports = catchAsync(
  async (
    req: Request<{}, {}, {}, GetReportsInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const { childId, limit = 10 } = req.query;
    const parentID = req.user!.id;
    let options: {
      parent: string;
      child?: string;
    } = {
      parent: parentID,
    };
    if (childId) {
      options = {
        parent: parentID,
        child: childId,
      };
    }
    const reports = await ReportModel.find(options)
      // .populate('Child', 'firstName lastName')
      .sort({ releaseDate: -1 })
      .limit(limit)
      .lean();
    return res.status(HttpStatusCode.OK).json({
      success: true,
      reports: reports?.length,
      data: { reports },
    });
  },
);
