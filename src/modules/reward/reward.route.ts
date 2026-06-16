import bindRoute from '@/core/utils/routeBounder';
import { API } from '@anis/shared';
import { Router } from 'express';

import {
  addReward,
  deleteReward,
  getAllReward,
  getReward,
  myPoints,
  redeemReward,
  updateReward,
} from './reward.controller.js';
import {
  addRewardSchema,
  getAllRewardSchema,
  getRewardSchema,
  redeemRewardSchema,
  updateRewardSchema,
} from './reward.schema.js';

const { ADD, GET_ALL, GET, UPDATE, DELETE, REDEEM, MY_POINTS } =
  API.REWARD.ROUTES;

const rewardRouter = Router({ mergeParams: true });

bindRoute(rewardRouter, MY_POINTS, myPoints);
bindRoute(rewardRouter, REDEEM, redeemReward, redeemRewardSchema);

bindRoute(rewardRouter, ADD, addReward, addRewardSchema);

bindRoute(rewardRouter, GET_ALL, getAllReward, getAllRewardSchema);

bindRoute(rewardRouter, GET, getReward, getRewardSchema);

bindRoute(rewardRouter, UPDATE, updateReward, updateRewardSchema);

bindRoute(rewardRouter, DELETE, deleteReward, getRewardSchema);

export default rewardRouter;
