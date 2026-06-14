import { authMiddleware } from '@/core/middleware/auth.middleware';
import { reqValidate } from '@/core/middleware/validation.middleware';
import { generateReport, getReports } from '@/modules/report/report.controller';
import {
  generateReportSchema,
  getReportSchema,
} from '@/modules/report/report.schema';
import { API } from '@anis/shared';
import { Router } from 'express';

const { SEND, GET, GET_ALL, DELETE, EDIT } = API.REPORT.ROUTES;
export const reportRouter = Router();

reportRouter[SEND.method](
  SEND.path,
  authMiddleware, //FIXME: handle it later with api auth instead of user auth
  reqValidate(generateReportSchema),
  generateReport,
);

reportRouter[GET.method](
  GET.path,
  authMiddleware,
  reqValidate(getReportSchema),
  getReports,
);

export default reportRouter;
