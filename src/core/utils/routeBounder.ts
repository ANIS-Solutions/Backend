import { authMiddleware } from '@/core/middleware/auth.middleware';
import { reqValidate } from '@/core/middleware/validation.middleware';
import { EndpointConfig } from '@anis/shared';
import { RequestHandler, Router } from 'express';
import { RateLimitRequestHandler } from 'express-rate-limit';
import { ZodType } from 'zod';

import { verifyChildOwnership } from '../middleware/isParent.middleware.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
const bindRoute = (
  router: Router,
  endpoint: EndpointConfig,
  controller: RequestHandler<any, any, any, any>,
  schema?: ZodType,
  rateLimiter?: RateLimitRequestHandler,
): void => {
  const middlewares: RequestHandler[] = [];

  if (endpoint.auth) {
    middlewares.push(authMiddleware);
  }

  if (schema) {
    middlewares.push(reqValidate(schema));
  }

  if (endpoint.grantChild) {
    middlewares.push(verifyChildOwnership);
  }

  if (rateLimiter && endpoint.rateLimiter) {
    middlewares.push(rateLimiter);
  }

  router[endpoint.method](endpoint.path, ...middlewares, controller);
};
export default bindRoute;
