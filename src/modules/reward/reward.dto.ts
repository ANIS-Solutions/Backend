import { IRewardBase } from '@anis/shared';
import { Types } from 'mongoose';

import { IReward } from './reward.model.js';

type LeanReward = Omit<IReward, 'id'> &
  Required<{ _id: Types.ObjectId }> & { __v: number };

export const toRewardInfo = (reward: IReward | LeanReward): IRewardBase => {
  const safeId =
    (reward as IReward).id || (reward as LeanReward)._id.toString();
  const safeChildId =
    (reward as IReward).childId.toString() ||
    (reward as LeanReward).childId.toString();

  return {
    id: safeId,
    childId: safeChildId,
    name: reward.name,
    description: reward.description,
    pointsCost: reward.pointsCost,
    redemptionType: reward.redemptionType,
    maxRedemptions: reward.maxRedemptions,
    timesRedeemed: reward.timesRedeemed,
    ...(reward.deadline && { deadline: reward.deadline }),
  };
};
