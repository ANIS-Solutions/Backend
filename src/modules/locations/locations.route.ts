import { authMiddleware } from '@core/middleware/authMiddleware';
import { authValidate } from '@core/middleware/validationMiddleware';
import { addLocation } from '@modules/locations/locations.controller';
import { locationsSchema } from '@modules/locations/locations.schema';
import { Router } from 'express';

const locationsRouter = Router();
locationsRouter.post(
  '/add',
  authMiddleware,
  authValidate(locationsSchema),
  addLocation,
);
export default locationsRouter;
