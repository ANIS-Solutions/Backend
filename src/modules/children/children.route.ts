import { authMiddleware } from '@core/middleware/authMiddleware';
import { authValidate } from '@core/middleware/validationMiddleware';
import {
  add_children,
  get_all_children,
  get_single_children,
} from '@modules/children/children.controller';
import {
  createChildSchema,
  getSingleChildSchema,
} from '@modules/children/children.schema';
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
