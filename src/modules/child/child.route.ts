import bindRoute from '@/core/utils/routeBounder';
import {
  addChildren,
  deleteMyChild,
  getMe,
  getMyChild,
  getMyChildren,
  pairChild,
  repairChild,
  requestRepairChild,
  updateMyChild,
} from '@/modules/child/child.controller';
import {
  createChildSchema,
  deleteChildSchema,
  getSingleChildSchema,
  pairChildSchema,
  repairChildSchema,
  requestRepairChildSchema,
  updateChildSchema,
} from '@/modules/child/child.schema';
import { API } from '@anis/shared';
import { Router } from 'express';

const childRouter = Router();
const { ADD, GET, GET_ALL, UPDATE, DELETE, PAIR, ME, REPAIR, REQUEST_REPAIR } =
  API.CHILDREN.ROUTES;

bindRoute(childRouter, ME, getMe);

bindRoute(childRouter, ADD, addChildren, createChildSchema);
bindRoute(childRouter, GET_ALL, getMyChildren);
bindRoute(childRouter, GET, getMyChild, getSingleChildSchema);
bindRoute(childRouter, DELETE, deleteMyChild, deleteChildSchema);
bindRoute(childRouter, UPDATE, updateMyChild, updateChildSchema);
bindRoute(
  childRouter,
  REQUEST_REPAIR,
  requestRepairChild,
  requestRepairChildSchema,
);
bindRoute(childRouter, PAIR, pairChild, pairChildSchema);
bindRoute(childRouter, REPAIR, repairChild, repairChildSchema);

export default childRouter;
