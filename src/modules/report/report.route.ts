import { authMiddleware } from '@core/middleware/authMiddleware';
import { authValidate } from '@core/middleware/validationMiddleware';
import { generateReport, getReports } from '@modules/report/report.controller';
import {
  generateReportSchema,
  getReportSchema,
} from '@modules/report/report.schema';
import { Router } from 'express';

export const reportRouter = Router();

reportRouter.post(
  '/',
  authMiddleware, //FIXME: handle it later with api auth instead of user auth
  authValidate(generateReportSchema),
  generateReport,
);

reportRouter.get(
  '/',
  authMiddleware,
  authValidate(getReportSchema),
  getReports,
);

export default reportRouter;
