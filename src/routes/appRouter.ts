import {
  blockApp,
  getAllApps,
  getSingleApp,
  unblockApp,
} from '@controllers/appControllers';
import { authMiddleware } from '@middlewares/authMiddleware';
import { authValidate } from '@middlewares/validationMiddleware';
import {
  blockAppSchema,
  getAllAppsSchema,
  getSingleAppSchema,
  unblockAppSchema,
} from '@schemas/appSchema';
import { Router } from 'express';

const appsRouter = Router();

appsRouter.use(authMiddleware);

// Get all child apps
appsRouter.get('/:childId/apps', authValidate(getAllAppsSchema), getAllApps);

// Get single app
appsRouter.post(
  '/:childId/apps/:appId',
  authValidate(getSingleAppSchema),
  getSingleApp,
);

// Block app
appsRouter.post('/block', authValidate(blockAppSchema), blockApp);

//Unblock app
appsRouter.post('/unblock', authValidate(unblockAppSchema), unblockApp);

// // Set daily limit
// appsRouter.post('/daily-limit', authValidate(setDailyLimit), setDailyLimit);

// // Remove daily limit
// appsRouter.post(
//   '/remove-daily-limit',
//   authValidate(removeDailyLimit),
//   removeDailyLimit,
// );

// // Set allowed time range
// appsRouter.post('/allowed-time', authValidate(setAllowedTime), setAllowedTime);

// // Remove allowed time range
// appsRouter.post(
//   '/remove-allowed-time',
//   authValidate(removeAllowedTime),
//   removeAllowedTime,
// );

// // Mark unlimited learning
// appsRouter.post(
//   '/unlimited-learning',
//   authValidate(markUnlimitedLearning),
//   markUnlimitedLearning,
// );

// // Remove unlimited learning
// appsRouter.post(
//   '/remove-unlimited-learning',
//   authValidate(removeUnlimitedLearning),
//   removeUnlimitedLearning,
// );

// // Get app usage
// appsRouter.get(
//   '/:childId/:appId/usage',
//   authValidate(getAppUsage),
//   getAppUsage,
// );

// // Daily summary
// appsRouter.get(
//   '/:childId/summary/daily',
//   authValidate(getDailySummary),
//   getDailySummary,
// );

// // Weekly summary
// appsRouter.get(
//   '/:childId/summary/weekly',
//   authValidate(getWeeklySummary),
//   getWeeklySummary,
// );

// // Reset app restrictions
// appsRouter.post(
//   '/reset',
//   authValidate(resetAppRestrictions),
//   resetAppRestrictions,
// );
export default appsRouter;
