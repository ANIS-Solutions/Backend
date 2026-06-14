import { IRewardBase, RewardRedemption } from '@anis/shared';
import mongoose, { Schema } from 'mongoose';

export interface IReward extends Omit<IRewardBase, 'id' | 'childId'> {
  id: string;
  childId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RewardSchema = new Schema<IReward>(
  {
    childId: {
      type: mongoose.Types.ObjectId,
      ref: 'Child',
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    pointsCost: { type: Number, required: true },
    redemptionType: { type: String, enum: RewardRedemption, required: true },
    maxRedemptions: { type: Number },
    timesRedeemed: { type: Number, default: 0 },
    deadline: { type: Date, required: false },
  },
  { timestamps: true },
);

export const RewardModel = mongoose.model<IReward>('Reward', RewardSchema);
