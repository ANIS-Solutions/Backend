import { catchAsync } from '@core/utils/catchAsync';
import HttpStatusCode from '@core/utils/HttpStatusCode';
import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';

import { IParent } from '../auth/auth.model.js';
import { ReportModel } from './report.model.js';
import { GenerateReportInput, GetReportsInput } from './report.schema.js';

export const generateReport = catchAsync(
  async (
    req: Request<{}, {}, GenerateReportInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const { report, childId } = req.body; // TODO: Auth special for FastAPI Services, for now use User Auth.
    const parentID = (req.user as IParent)._id;

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
    const parentID = (req.user as IParent)._id;
    let options: {
      parent: mongoose.Types.ObjectId;
      child?: mongoose.Types.ObjectId;
    } = {
      parent: parentID,
    };
    if (childId) {
      options = {
        parent: parentID,
        child: new mongoose.Types.ObjectId(childId),
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
