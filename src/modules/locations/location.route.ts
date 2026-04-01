import { authMiddleware } from '@/core/middleware/auth.middleware';
import { reqValidate } from '@/core/middleware/validation.middleware';
import { addLocation } from '@/modules/locations/location.controller';
import { locationsSchema } from '@/modules/locations/location.schema';
import { Router } from 'express';

const locationsRouter = Router();
locationsRouter.post(
  '/add',
  authMiddleware,
  reqValidate(locationsSchema),
  addLocation,
);
export default locationsRouter;
