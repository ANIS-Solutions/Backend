import { addLocation } from '@controllers/locationsController';
import { authMiddleware } from '@middlewares/authMiddleware';
import { authValidate } from '@middlewares/validationMiddleware';
import { locationsSchema } from '@schemas/locationsSchema';
import { Router } from 'express';

export const locationsRouter = Router();
locationsRouter.post(
  '/add',
  authMiddleware,
  authValidate(locationsSchema),
  addLocation,
);
