import bindRoute from '@/core/utils/routeBounder';
import { API } from '@anis/shared';
import { Router } from 'express';

import {
  addApp,
  addBulkApps,
  getApp,
  getApps,
  limitApp,
  removeApp,
  toggleBlockApp,
} from './app.controller.js';
import {
  addAppSchema,
  addBulkAppsSchema,
  getAppSchema,
  getAppsSchema,
  removeAppSchema,
  setLimitSchema,
  toggleBlockSchema,
} from './app.schema.js';

const { ADD, ADD_BULK, GET_CHILD_APPS, GET_CHILD_APP, DELETE, BLOCK, LIMIT } =
  API.APP.ROUTES;
const appRouter = Router();

bindRoute(appRouter, ADD, addApp, addAppSchema);
bindRoute(appRouter, ADD_BULK, addBulkApps, addBulkAppsSchema);
bindRoute(appRouter, GET_CHILD_APPS, getApps, getAppsSchema);
bindRoute(appRouter, GET_CHILD_APP, getApp, getAppSchema);
bindRoute(appRouter, DELETE, removeApp, removeAppSchema);
bindRoute(appRouter, BLOCK, toggleBlockApp, toggleBlockSchema);
bindRoute(appRouter, LIMIT, limitApp, setLimitSchema);

export default appRouter;
