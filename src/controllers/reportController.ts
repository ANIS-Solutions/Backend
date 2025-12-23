/* eslint-disable @typescript-eslint/no-empty-object-type */
import { IParent } from '@models/authModels';
import { ReportModel } from '@models/reportModel';
import { GenerateReportInput, GetReportsInput } from '@schemas/reportSchema';
import { catchAsync } from '@utils/catchAsync';
import HttpStatusCode from '@utils/HttpStatusCode';
import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';

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
