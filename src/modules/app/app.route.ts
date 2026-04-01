import { reqValidate } from '@/core/middleware/validation.middleware';
import { API } from '@anis/shared';
import { Router } from 'express';

import {
  addApp,
  blockApp,
  getApp,
  getApps,
  limitApp,
  removeApp,
  updateApp,
} from './app.controller.js';
import {
  addAppSchema,
  getAppSchema,
  getAppsSchema,
  removeAppSchema,
  setLimitSchema,
  toggleBlockSchema,
  updateAppSchema,
} from './app.schema.js';

const { ADD, GET_CHILD_APPS, GET_CHILD_APP, UPDATE, DELETE, BLOCK, LIMIT } =
  API.APP.ROUTES;
const appRouter = Router();

// child auth middleware
appRouter[ADD.method](ADD.path, reqValidate(addAppSchema), addApp);
appRouter[GET_CHILD_APPS.method](
  GET_CHILD_APPS.path,
  reqValidate(getAppsSchema),
  getApps,
);
appRouter[GET_CHILD_APP.method](
  GET_CHILD_APP.path,
  reqValidate(getAppSchema),
  getApp,
);
appRouter[DELETE.method](DELETE.path, reqValidate(removeAppSchema), removeApp);
appRouter[UPDATE.method](UPDATE.path, reqValidate(updateAppSchema), updateApp);
appRouter[BLOCK.method](BLOCK.path, reqValidate(toggleBlockSchema), blockApp);
appRouter[LIMIT.method](LIMIT.path, reqValidate(setLimitSchema), limitApp);
appRouter[LIMIT.method](LIMIT.path, reqValidate(setLimitSchema), limitApp);
export default appRouter;
