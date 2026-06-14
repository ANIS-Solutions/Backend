import bindRoute from '@/core/utils/routeBounder';
import { API } from '@anis/shared';
import { Router } from 'express';

import { requestScreenCast } from './screencast.controller.js';
import { screenCastRequestSchema } from './screencast.schema.js';

const screenCastRouter = Router({ mergeParams: true });
const { REQUEST } = API.SCREEN_CAST.ROUTES;

// screenRouter.post('/request', requireAuth, requestScreenShareController);
bindRoute(
  screenCastRouter,
  REQUEST,
  requestScreenCast,
  screenCastRequestSchema,
);

export default screenCastRouter;
