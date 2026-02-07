import healthRouter from '@api/healthRoute';
import AppError from '@core/utils/AppError';
import HttpStatusCode from '@core/utils/HttpStatusCode';
import appRouter from '@modules/app/app.route';
import authRouter from '@modules/auth/auth.route';
import childrenRouter from '@modules/children/children.route';
import eduRouter from '@modules/education/edu.route';
import locationsRouter from '@modules/locations/locations.route';
import questRouter from '@modules/quest/quest.route';
import reportRouter from '@modules/report/report.route';
import { Router } from 'express';

const router = Router();
router.use('/', healthRouter);

router.use('/auth', authRouter);
router.use('/children', childrenRouter);
router.use('/quest', questRouter);
router.use('/report', reportRouter);
router.use('/edu', eduRouter);
router.use('/locations', locationsRouter);
router.use('/app', appRouter);

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
