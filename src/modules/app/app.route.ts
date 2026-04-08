import { reqValidate } from '@/core/middleware/validation.middleware';
import bindRoute from '@/core/utils/routeBounder';
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

bindRoute(appRouter, ADD, addApp, addAppSchema);
bindRoute(appRouter, GET_CHILD_APPS, getApps, getAppsSchema);
bindRoute(appRouter, GET_CHILD_APP, getApp, getAppSchema);
bindRoute(appRouter, UPDATE, updateApp, updateAppSchema);
bindRoute(appRouter, DELETE, removeApp, removeAppSchema);
bindRoute(appRouter, BLOCK, blockApp, toggleBlockSchema);
bindRoute(appRouter, LIMIT, limitApp, setLimitSchema);

export default appRouter;
