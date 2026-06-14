import { authMiddleware } from '@/core/middleware/auth.middleware';
import { reqValidate } from '@/core/middleware/validation.middleware';
import type { EndpointConfig } from '@anis/shared';
import type { RequestHandler, Router } from 'express';
import type { RateLimitRequestHandler } from 'express-rate-limit';
import type { ZodType } from 'zod';

import { verifyChildOwnership } from '../middleware/isParent.middleware.js';
import {
  createMulterMiddleware,
  validateUploadedFiles,
  type MulterConfig,
} from '../middleware/multer.middleware.js';

interface BindRouteConfig {
  rateLimiter?: RateLimitRequestHandler;
  multer?: MulterConfig;
}
/* eslint-disable @typescript-eslint/no-explicit-any */

const bindRoute = (
  router: Router,
  endpoint: EndpointConfig,
  controller: RequestHandler<any, any, any, any>,
  schema?: ZodType,
  config?: BindRouteConfig,
): void => {
  const middlewares: RequestHandler[] = [];

  if (config?.rateLimiter && endpoint.rateLimiter) {
    middlewares.push(config.rateLimiter);
  }
  if (endpoint.auth) {
    middlewares.push(authMiddleware);
  }

  if (endpoint.grantChild) {
    middlewares.push(verifyChildOwnership);
  }
  if (config?.multer) {
    middlewares.push(createMulterMiddleware(config.multer));
    middlewares.push(validateUploadedFiles);
  }

  if (schema) {
    middlewares.push(reqValidate(schema));
  }

  router[endpoint.method](endpoint.path, ...middlewares, controller);
};

export default bindRoute;
