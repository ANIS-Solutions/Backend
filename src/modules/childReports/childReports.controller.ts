import ApiResponse from '@/core/handlers/api.handler';
import { catchAsync } from '@/core/utils/catchAsync';
import { HttpStatusCode } from '@anis/shared';
import type { NextFunction, Request, Response } from 'express';

import type {
  GenerateChildReportBody,
  GenerateChildReportParams,
  GetChildReportParams,
  GetChildReportsParams,
  GetChildReportsQuery,
} from './childReports.schema.js';
import {
  getChildReportById,
  getChildReports,
  requestReportGeneration,
} from './childReports.services.js';

export const generateChildReport = catchAsync(
  async (
    req: Request<GenerateChildReportParams, unknown, GenerateChildReportBody>,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    const { childId } = req.params;
    const { sessionDocId } = req.body;
    const parentId = req.user!.id;

    const reportId = await requestReportGeneration(
      childId,
      parentId,
      sessionDocId,
    );

    ApiResponse.success(
      res,
      HttpStatusCode.ACCEPTED,
      'Report generation queued',
      {
        data: { reportId },
      },
    );
  },
);

export const getAllChildReports = catchAsync(
  async (
    req: Request<GetChildReportsParams, unknown, unknown, GetChildReportsQuery>,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    const { childId } = req.params;
    const { limit = 10, page = 1 } = req.query;

    const { reports, total } = await getChildReports(childId, limit, page);

    ApiResponse.success(res, HttpStatusCode.OK, 'Reports retrieved', {
      data: { reports },
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  },
);

export const getOneChildReport = catchAsync(
  async (
    req: Request<GetChildReportParams>,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    const { childId, reportId } = req.params;

    const report = await getChildReportById(childId, reportId);

    ApiResponse.success(res, HttpStatusCode.OK, 'Report retrieved', {
      data: { report },
    });
  },
);
