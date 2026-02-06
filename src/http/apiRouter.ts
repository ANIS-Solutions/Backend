import AppError from '@core/utils/AppError';
import HttpStatusCode from '@core/utils/HttpStatusCode';
import healthRouter from '@http/healthRoute';
import appRouter from '@modules/app/appRoute';
import authRouter from '@modules/auth/authRoute';
import childrenRouter from '@modules/children/childrenRoute';
import eduRouter from '@modules/education/eduRoute';
import locationsRouter from '@modules/locations/locationsRoute';
import questRouter from '@modules/quest/questRoute';
import reportRouter from '@modules/report/reportRoute';
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
