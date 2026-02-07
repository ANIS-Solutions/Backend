import { authMiddleware } from '@core/middleware/authMiddleware';
import { authValidate } from '@core/middleware/validationMiddleware';
import { Router } from 'express';

import { addEdu } from './edu.controller.js';
import { addEduSchema } from './edu.schema.js';

export const eduRouter = Router();

eduRouter.post('/add', authMiddleware, authValidate(addEduSchema), addEdu);

export default eduRouter;
