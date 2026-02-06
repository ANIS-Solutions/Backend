import {
  add_children,
  get_all_children,
  get_single_children,
} from '@controllers/childrenController';
import { authMiddleware } from '@middlewares/authMiddleware';
import { authValidate } from '@middlewares/validationMiddleware';
import {
  createChildSchema,
  getSingleChildSchema,
} from '@schemas/childrenSchema';
import { Router } from 'express';

//FIXME: children?? -> Should be child, each time call this api child/add to add one child not many!
const childrenRouter = Router();

childrenRouter.post(
  '/add',
  authMiddleware,
  authValidate(createChildSchema),
  add_children,
);

childrenRouter.get('/', authMiddleware, get_all_children);

childrenRouter.get(
  '/:childId',
  authMiddleware,
  authValidate(getSingleChildSchema),
  get_single_children,
);
export default childrenRouter;
