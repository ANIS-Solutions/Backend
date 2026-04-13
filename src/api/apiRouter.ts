import healthRouter from '@/api/healthRoute';
import AppError from '@/core/utils/AppError';
import appRouter from '@/modules/app/app.route';
import authRouter from '@/modules/auth/auth.route';
import childrenRouter from '@/modules/child/child.route';
import eduRouter from '@/modules/education/edu.route';
import locationsRouter from '@/modules/locations/location.route';
import parentRouter from '@/modules/parent/parent.route';
import reportRouter from '@/modules/report/report.route';
import { API, HttpStatusCode } from '@anis/shared';
import { Router } from 'express';

const router = Router();
const { PARENT, AUTH, QUEST, CHILDREN, REPORT, EDUCATION, LOCATIONS, APP } =
  API;
router.use('/', healthRouter);

router.use(AUTH.PREFIX, authRouter);
router.use(PARENT.PREFIX, parentRouter);
router.use(CHILDREN.PREFIX, childrenRouter);
router.use(REPORT.PREFIX, reportRouter);
router.use(EDUCATION.PREFIX, eduRouter);
router.use(LOCATIONS.PREFIX, locationsRouter);
router.use(APP.PREFIX, appRouter);

// https://stackoverflow.com/a/79554232/28759450
router.all('/{*splat}', (req, res, next) => {
  next(
    new AppError(
      `Can't find ${req.originalUrl} on this server!`,
      HttpStatusCode.NOT_FOUND,
    ),
  );
});
export default router;
