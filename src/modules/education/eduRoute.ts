import { authMiddleware } from '@core/middlewares/authMiddleware';
import { authValidate } from '@core/middlewares/validationMiddleware';
import { Router } from 'express';

import { addEdu } from './eduController.js';
import { addEduSchema } from './eduSchema.js';

export const eduRouter = Router();

eduRouter.post('/add', authMiddleware, authValidate(addEduSchema), addEdu);

export default eduRouter;
