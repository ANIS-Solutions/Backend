import bindRoute from '@/core/utils/routeBounder';
import { API } from '@anis/shared';
import { Router } from 'express';

import {
  deleteAllNotifications,
  deleteNotification,
  getAllNotification,
  markAsReadNotification,
} from './notifications.controller.js';
import {
  deleteAllNotificationSchema,
  deleteNotificationSchema,
  getAllNotificationSchema,
  markAsReadNotificationSchema,
} from './notifications.schema.js';

const notificationsRouter = Router();
const { GET_ALL, DELETE, CLEAR_ALL, MARK_AS_READ } = API.NOTIFICATIONS.ROUTES;

bindRoute(
  notificationsRouter,
  GET_ALL,
  getAllNotification,
  getAllNotificationSchema,
);

bindRoute(
  notificationsRouter,
  DELETE,
  deleteNotification,
  deleteNotificationSchema,
);

bindRoute(
  notificationsRouter,
  CLEAR_ALL,
  deleteAllNotifications,
  deleteAllNotificationSchema,
);

bindRoute(
  notificationsRouter,
  MARK_AS_READ,
  markAsReadNotification,
  markAsReadNotificationSchema,
);

export default notificationsRouter;
