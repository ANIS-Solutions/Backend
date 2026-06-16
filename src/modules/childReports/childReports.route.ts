import { authMiddleware } from '@/core/middleware/auth.middleware';
import { verifyChildOwnership } from '@/core/middleware/isParent.middleware';
import { reqValidate } from '@/core/middleware/validation.middleware';
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

childReportsRouter[GENERATE.method](
  GENERATE.path,
  authMiddleware,
  verifyChildOwnership,
  reqValidate(generateChildReportSchema),
  generateChildReport,
);

childReportsRouter[GET_ALL.method](
  GET_ALL.path,
  authMiddleware,
  verifyChildOwnership,
  reqValidate(getChildReportsSchema),
  getAllChildReports,
);

childReportsRouter[GET.method](
  GET.path,
  authMiddleware,
  verifyChildOwnership,
  reqValidate(getChildReportSchema),
  getOneChildReport,
);

export default childReportsRouter;
