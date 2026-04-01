import { authMiddleware } from '@/core/middleware/auth.middleware';
import { reqValidate } from '@/core/middleware/validation.middleware';
import { API } from '@anis/shared';
import { Router } from 'express';

import { addEdu } from './edu.controller.js';
import { addEduRequestSchema } from './edu.schema.js';

const { ADD, GET, GET_ALL, DELETE, EDIT } = API.EDUCATION.ROUTES;
export const eduRouter = Router();

eduRouter[ADD.method](
  ADD.path,
  authMiddleware,
  reqValidate(addEduRequestSchema),
  addEdu,
);

export default eduRouter;
