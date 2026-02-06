import { authMiddleware } from '@core/middlewares/authMiddleware';
import { authValidate } from '@core/middlewares/validationMiddleware';
import { addLocation } from '@modules/locations/locationsController';
import { locationsSchema } from '@modules/locations/locationsSchema';
import { Router } from 'express';

const locationsRouter = Router();
locationsRouter.post(
  '/add',
  authMiddleware,
  authValidate(locationsSchema),
  addLocation,
);
export default locationsRouter;
