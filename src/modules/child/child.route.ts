import { authMiddleware } from '@/core/middleware/auth.middleware';
import { reqValidate } from '@/core/middleware/validation.middleware';
import {
  add_children,
  get_all_children,
  get_single_children,
  update_my_child,
} from '@/modules/child/child.controller';
import {
  createChildSchema,
  getSingleChildSchema,
  updateChildSchema,
} from '@/modules/child/child.schema';
import { API } from '@anis/shared';
import { Router } from 'express';

const childRouter = Router();
const { ADD, GET, GET_ALL, UPDATE } = API.CHILDREN.ROUTES;
childRouter[ADD.method](
  ADD.path,
  authMiddleware,
  reqValidate(createChildSchema),
  add_children,
);

childRouter[GET_ALL.method](GET_ALL.path, authMiddleware, get_all_children);

childRouter[GET.method](
  GET.path,
  authMiddleware,
  reqValidate(getSingleChildSchema),
  get_single_children,
);

childRouter[UPDATE.method](
  UPDATE.path,
  authMiddleware,
  reqValidate(updateChildSchema),
  update_my_child,
);
export default childRouter;
