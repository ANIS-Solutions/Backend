import { authMiddleware } from '@core/middlewares/authMiddleware';
import { authValidate } from '@core/middlewares/validationMiddleware';
import { generateReport, getReports } from '@modules/report/reportController';
import {
  generateReportSchema,
  getReportSchema,
} from '@modules/report/reportSchema';
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
