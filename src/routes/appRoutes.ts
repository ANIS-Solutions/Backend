import {
  addApp,
  blockApp,
  limitApp,
  removeApp,
  updateApp,
} from '@controllers/appController';
import { authValidate } from '@middlewares/validationMiddleware';
import {
  addAppSchema,
  removeAppSchema,
  setLimitSchema,
  toggleBlockSchema,
  updateAppSchema,
} from '@schemas/appSchema';
import { Router } from 'express';

const appRouter = Router();

// child auth middleware
appRouter.post('/', authValidate(addAppSchema), addApp);
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
