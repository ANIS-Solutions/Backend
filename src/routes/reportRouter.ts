import { generateReport, getReports } from '@controllers/reportController';
import { authMiddleware } from '@middlewares/authMiddleware';
import { authValidate } from '@middlewares/validationMiddleware';
import { generateReportSchema, getReportSchema } from '@schemas/reportSchema';
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
