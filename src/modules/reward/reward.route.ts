import bindRoute from '@/core/utils/routeBounder';
import { API } from '@anis/shared';
import { Router } from 'express';

import {
  addReward,
  deleteReward,
  getAllReward,
  getReward,
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

const { ADD, GET_ALL, GET, UPDATE, DELETE, REDEEM } = API.REWARD.ROUTES;

const rewardRouter = Router({ mergeParams: true });

bindRoute(rewardRouter, ADD, addReward, addRewardSchema);

bindRoute(rewardRouter, GET_ALL, getAllReward, getAllRewardSchema);

bindRoute(rewardRouter, GET, getReward, getRewardSchema);

bindRoute(rewardRouter, UPDATE, updateReward, updateRewardSchema);

bindRoute(rewardRouter, DELETE, deleteReward, getRewardSchema);

bindRoute(rewardRouter, REDEEM, redeemReward, redeemRewardSchema);

export default rewardRouter;
