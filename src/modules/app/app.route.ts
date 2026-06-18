import bindRoute from '@/core/utils/routeBounder';
import { API } from '@anis/shared';
import { Router } from 'express';

import {
  addApp,
  addBulkApps,
  addDailyUsage,
  getApp,
  getApps,
  getDailyUsage,
  getLastWeekUsage,
  limitApp,
  pingChildAppUsage,
  removeApp,
  toggleBlockApp,
} from './app.controller.js';
import {
  addAppSchema,
  addBulkAppsSchema,
  addDailyUsageSchema,
  getAppSchema,
  getAppsSchema,
  getDailyUsageSchema,
  pingAppUsageSchema,
  removeAppSchema,
  setLimitSchema,
  toggleBlockSchema,
} from './app.schema.js';

const {
  ADD,
  ADD_BULK,
  ADD_DAILY_USAGE,
  GET_CHILD_APPS,
  GET_CHILD_APP,
  GET_DAILY_USAGE,
  GET_LAST_WEEK_USAGE,
  DELETE,
  BLOCK,
  LIMIT,
  UPDATE_USAGE,
} = API.APP.ROUTES;
const appRouter = Router();
const questRouter = Router({ mergeParams: true });

bindRoute(appRouter, ADD, addApp, addAppSchema);
bindRoute(appRouter, ADD_BULK, addBulkApps, addBulkAppsSchema);
bindRoute(appRouter, ADD_DAILY_USAGE, addDailyUsage, addDailyUsageSchema);
bindRoute(appRouter, GET_CHILD_APPS, getApps, getAppsSchema);
bindRoute(appRouter, GET_CHILD_APP, getApp, getAppSchema);
bindRoute(appRouter, GET_DAILY_USAGE, getDailyUsage, getDailyUsageSchema);
bindRoute(
  appRouter,
  GET_LAST_WEEK_USAGE,
  getLastWeekUsage,
  getDailyUsageSchema,
);
bindRoute(appRouter, DELETE, removeApp, removeAppSchema);
bindRoute(appRouter, BLOCK, toggleBlockApp, toggleBlockSchema);
bindRoute(appRouter, LIMIT, limitApp, setLimitSchema);
bindRoute(appRouter, UPDATE_USAGE, pingChildAppUsage, pingAppUsageSchema);

export default appRouter;
