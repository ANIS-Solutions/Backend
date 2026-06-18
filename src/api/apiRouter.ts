import healthRouter from '@/api/healthRoute';
import AppError from '@/core/utils/AppError';
import aiServicesRouter from '@/modules/AiServices/embedding.route';
import appRouter from '@/modules/app/app.route';
import authRouter from '@/modules/auth/auth.route';
import childrenRouter from '@/modules/child/child.route';
import childReportsRouter from '@/modules/childReports/childReports.route';
import childSessionsRouter from '@/modules/childSessions/childSessions.route';
import eduRouter from '@/modules/education/edu.route';
import locationsRouter from '@/modules/locations/location.route';
import notificationsRouter from '@/modules/notifications/notifications.route';
import parentRouter from '@/modules/parent/parent.route';
import questRouter from '@/modules/quest/quest.route';
import reportRouter from '@/modules/report/report.route';
import rewardRouter from '@/modules/reward/reward.route';
import screenCastRouter from '@/modules/screencast/screencast.route';
import { API, HttpStatusCode } from '@anis/shared';
import express, { Router } from 'express';

const largeJsonParser = express.json({ limit: '10mb' });

const router = Router();
const {
  PARENT,
  AUTH,
  QUEST,
  CHILDREN,
  REPORT,
  // EDUCATION,
  LOCATIONS,
  APP,
  REWARD,
  SCREEN_CAST,
  AI_SERVICES,
  NOTIFICATIONS,
  CHILD_SESSIONS,
  CHILD_REPORTS,
} = API;
router.use('/', healthRouter);

router.use(AUTH.PREFIX, authRouter);
router.use(PARENT.PREFIX, parentRouter);
router.use(QUEST.PREFIX, questRouter);
router.use(REWARD.PREFIX, rewardRouter);
router.use(CHILDREN.PREFIX, childrenRouter);
router.use(REPORT.PREFIX, reportRouter);
// router.use(EDUCATION.PREFIX, eduRouter);
router.use(LOCATIONS.PREFIX, locationsRouter);
router.use(APP.PREFIX, appRouter);
router.use(SCREEN_CAST.PREFIX, screenCastRouter);
router.use(AI_SERVICES.PREFIX, aiServicesRouter);
router.use(NOTIFICATIONS.PREFIX, notificationsRouter);
router.use(largeJsonParser);
router.use(CHILD_SESSIONS.PREFIX, childSessionsRouter);
router.use(CHILD_REPORTS.PREFIX, childReportsRouter);

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
