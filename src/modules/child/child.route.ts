import bindRoute from '@/core/utils/routeBounder';
import {
  addChildren,
  getMe,
  getMyChild,
  getMyChildren,
  pairChild,
  updateMyChild,
} from '@/modules/child/child.controller';
import {
  createChildSchema,
  getSingleChildSchema,
  pairChildSchema,
  updateChildSchema,
} from '@/modules/child/child.schema';
import { API } from '@anis/shared';
import { Router } from 'express';

const childRouter = Router();
const { ADD, GET, GET_ALL, UPDATE, PAIR, ME } = API.CHILDREN.ROUTES;

bindRoute(childRouter, ME, getMe);

bindRoute(childRouter, ADD, addChildren, createChildSchema);
bindRoute(childRouter, GET_ALL, getMyChildren);
bindRoute(childRouter, GET, getMyChild, getSingleChildSchema);
bindRoute(childRouter, UPDATE, updateMyChild, updateChildSchema);
bindRoute(childRouter, PAIR, pairChild, pairChildSchema);

export default childRouter;
