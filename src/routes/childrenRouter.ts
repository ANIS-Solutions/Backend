import {
  add_children,
  get_all_children,
  get_single_children,
} from '@controllers/childrenController';
import { authMiddleware } from '@middlewares/authMiddleware';
import { authValidate } from '@middlewares/validationMiddleware';
import { createChildSchema } from '@schemas/childrenSchema';
import { Router } from 'express';

const childrenRouter = Router();

childrenRouter.post(
  '/add',
  authMiddleware,
  authValidate(createChildSchema),
  add_children,
);

childrenRouter.get('/', authMiddleware, get_all_children);

childrenRouter.get('/:id', authMiddleware, get_single_children);
export default childrenRouter;
