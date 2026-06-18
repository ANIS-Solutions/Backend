import AppError from '@/core/utils/AppError';
import logger from '@/core/utils/logger';
import { HttpStatusCode, IRewardBase, RewardRedemption } from '@anis/shared';

import { ChildModel } from '../child/child.model.js';
import { toRewardInfo } from './reward.dto.js';
import { RewardModel } from './reward.model.js';
import {
  AddRewardBodyInput,
  AddRewardParamsInput,
  GetAllRewardParamsInput,
  GetRewardParamsInput,
  RedeemRewardParamsInput,
  UpdateRewardBodyInput,
  UpdateRewardParamsInput,
} from './reward.schema.js';

export const addRewardService = async (
  reqParams: AddRewardParamsInput,
  reqBody: AddRewardBodyInput,
): Promise<IRewardBase> => {
  const { childId } = reqParams;
  const {
    name,
    description,
    pointsCost,
    redemptionType,
    maxRedemptions,
    deadline,
  } = reqBody;
  // const currChild = await ChildModel.findById(childId);
  const newReward = await RewardModel.create({
    name,
    childId,
    description,
    pointsCost,
    redemptionType,
    maxRedemptions,
    ...(deadline && { deadline }),
  });
  return toRewardInfo(newReward);
};

export const getRewardService = async (
  reqParams: GetRewardParamsInput,
): Promise<IRewardBase> => {
  const { childId, rewardId } = reqParams;

  const currReward = await RewardModel.findOne({ childId, _id: rewardId });
  if (!currReward)
    throw new AppError(
      'The reward not found in this child profile',
      HttpStatusCode.NOT_FOUND,
    );
  return toRewardInfo(currReward);
};

export const myPointsService = async (
  childId: string,
): Promise<{
  points: number;
}> => {
  const child = await ChildModel.findById(childId).select('points').lean();

  if (!child) {
    throw new AppError('Child profile not found', HttpStatusCode.NOT_FOUND);
  }

  return {
    points: child.points || 0,
  };
};

export const getAllRewardService = async (
  reqParams: GetAllRewardParamsInput,
): Promise<IRewardBase[]> => {
  const { childId } = reqParams;

  const currRewards = await RewardModel.find({ childId });
  if (!currRewards)
    throw new AppError(
      "This child doesn't have any current rewards",
      HttpStatusCode.NOT_FOUND,
    );
  return currRewards.map(toRewardInfo);
};

export const redeemRewardService = async (
  childId: string,
  reqParams: RedeemRewardParamsInput,
): Promise<IRewardBase> => {
  const { rewardId } = reqParams;

  // const currReward = await RewardModel.findOne({ childId, _id: rewardId });
  const currReward = await RewardModel.findById(rewardId);
  logger.info(currReward);
  logger.info(childId);
  logger.info(rewardId);
  if (!currReward)
    throw new AppError('Reward not found.', HttpStatusCode.NOT_FOUND);
  const currChild = await ChildModel.findById(childId);
  if (!currChild)
    throw new AppError('The child not found.', HttpStatusCode.NOT_FOUND);
  if (currReward.deadline && new Date() > currReward.deadline) {
    throw new AppError('This reward has expired.', HttpStatusCode.BAD_REQUEST);
  }
  if (
    currReward.redemptionType === RewardRedemption.ONCE &&
    currReward.timesRedeemed >= 1
  ) {
    throw new AppError(
      'This reward has already been redeemed.',
      HttpStatusCode.FORBIDDEN,
    );
  }

  if (
    currReward.redemptionType === RewardRedemption.MULTIPLE &&
    currReward.maxRedemptions &&
    currReward.timesRedeemed >= currReward.maxRedemptions
  )
    throw new AppError(
      'The max max redemptions is achieved.',
      HttpStatusCode.FORBIDDEN,
    );

  if (currReward.pointsCost > currChild.points)
    throw new AppError(
      'The reward cost is larger than your points.',
      HttpStatusCode.NOT_FOUND,
    );

  // currChild.points -= currReward.pointsCost;
  // currReward.timesRedeemed++;
  const updatedChild = await ChildModel.findOneAndUpdate(
    { _id: childId, points: { $gte: currReward.pointsCost } },
    { $inc: { points: -currReward.pointsCost } },
    { new: true },
  );
  logger.info(updatedChild?.points);
  if (!updatedChild) {
    throw new AppError(
      'Insufficient points to redeem this reward.',
      HttpStatusCode.PAYMENT_REQUIRED,
    );
  }
  const updatedReward = await RewardModel.findByIdAndUpdate(
    rewardId,
    { $inc: { timesRedeemed: 1 } },
    { new: true },
  );
  return toRewardInfo(updatedReward!);
};

export const updateRewardService = async (
  reqParams: UpdateRewardParamsInput,
  reqBody: UpdateRewardBodyInput,
): Promise<IRewardBase> => {
  const { childId, rewardId } = reqParams;

  const updatedReward = await RewardModel.findOneAndUpdate(
    { _id: rewardId, childId },
    { $set: reqBody },
    { new: true, runValidators: true },
  );

  if (!updatedReward) {
    throw new AppError('Reward not found', HttpStatusCode.NOT_FOUND);
  }

  return toRewardInfo(updatedReward);
};

export const deleteRewardService = async (
  reqParams: GetRewardParamsInput,
): Promise<void> => {
  const { childId, rewardId } = reqParams;

  const deletedReward = await RewardModel.findOneAndDelete({
    _id: rewardId,
    childId,
  });

  if (!deletedReward) {
    throw new AppError('Reward not found', HttpStatusCode.NOT_FOUND);
  }
};
