import { authValidate } from '@core/middlewares/validationMiddleware';
import { Router } from 'express';

import {
  addApp,
  blockApp,
  getApp,
  getApps,
  limitApp,
  removeApp,
  updateApp,
} from './appController.js';
import {
  addAppSchema,
  getAppSchema,
  getAppsSchema,
  removeAppSchema,
  setLimitSchema,
  toggleBlockSchema,
  updateAppSchema,
} from './appSchema.js';

const appRouter = Router();

// child auth middleware
appRouter.post('/', authValidate(addAppSchema), addApp);
appRouter.get('/:childId', authValidate(getAppsSchema), getApps);
appRouter.get('/:appId/:childId', authValidate(getAppSchema), getApp);
appRouter.delete('/:appId/:childId', authValidate(removeAppSchema), removeApp);
appRouter.patch('/:appId/:childId', authValidate(updateAppSchema), updateApp);
appRouter.patch(
  '/block/:appId/:childId',
  authValidate(toggleBlockSchema),
  blockApp,
);
appRouter.patch(
  '/limit/:appId/:childId',
  authValidate(setLimitSchema),
  limitApp,
);
export default appRouter;
