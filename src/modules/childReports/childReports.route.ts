import { authMiddleware } from '@/core/middleware/auth.middleware';
import { verifyChildOwnership } from '@/core/middleware/isParent.middleware';
import { reqValidate } from '@/core/middleware/validation.middleware';
import bindRoute from '@/core/utils/routeBounder';
import { API } from '@anis/shared';
import { Router } from 'express';

import {
  generateChildReport,
  getAllChildReports,
  getOneChildReport,
} from './childReports.controller.js';
import {
  generateChildReportSchema,
  getChildReportSchema,
  getChildReportsSchema,
} from './childReports.schema.js';

const { GENERATE, GET_ALL, GET } = API.CHILD_REPORTS.ROUTES;

const childReportsRouter = Router({ mergeParams: true });

bindRoute(
  childReportsRouter,
  GENERATE,
  generateChildReport,
  generateChildReportSchema,
);
bindRoute(
  childReportsRouter,
  GET_ALL,
  getAllChildReports,
  getChildReportsSchema,
);
bindRoute(childReportsRouter, GET, getOneChildReport, getChildReportSchema);

export default childReportsRouter;
