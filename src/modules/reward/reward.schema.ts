import { objectIdRegex, RewardRedemption } from '@anis/shared';
import z from 'zod';

const rewardBodySchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  description: z.string().min(1, 'Description is required').trim(),
  pointsCost: z.number().int().nonnegative('Points cannot be negative'),
  redemptionType: z.enum(RewardRedemption).default(RewardRedemption.ONCE),
  maxRedemptions: z.number().int().positive().optional().default(0),
  deadline: z.coerce.date().optional(),
});
export const addRewardSchema = z.object({
  params: z.object({
    childId: z.string().regex(objectIdRegex),
  }),
  body: rewardBodySchema,
});

export type AddRewardParamsInput = z.infer<typeof addRewardSchema>['params'];
export type AddRewardBodyInput = z.infer<typeof addRewardSchema>['body'];

export const updateRewardSchema = z.object({
  params: z.object({
    childId: z.string().regex(objectIdRegex),
    rewardId: z.string().regex(objectIdRegex),
  }),
  body: rewardBodySchema.partial(),
});

export type UpdateRewardParamsInput = z.infer<
  typeof updateRewardSchema
>['params'];
export type UpdateRewardBodyInput = z.infer<typeof updateRewardSchema>['body'];

export const gainRewardSchema = z.object({
  params: z.object({
    rewardId: z.string().regex(objectIdRegex),
  }),
});

export type GainRewardParamsInput = z.infer<typeof gainRewardSchema>['params'];

export const getRewardSchema = z.object({
  params: z.object({
    childId: z.string().regex(objectIdRegex),
    rewardId: z.string().regex(objectIdRegex),
  }),
});

export type GetRewardParamsInput = z.infer<typeof getRewardSchema>['params'];

export const getAllRewardSchema = z.object({
  params: z.object({
    childId: z.string().regex(objectIdRegex),
  }),
});

export type GetAllRewardParamsInput = z.infer<
  typeof getAllRewardSchema
>['params'];

export const getMyRewardSchema = z.object({
  params: z.object({
    childId: z.string().regex(objectIdRegex),
  }),
});

export type GetMyRewardParamsInput = z.infer<
  typeof getMyRewardSchema
>['params'];

export const redeemRewardSchema = z.object({
  params: z.object({
    // childId: z.string().regex(objectIdRegex),
    rewardId: z.string().regex(objectIdRegex),
  }),
});

export type RedeemRewardParamsInput = z.infer<
  typeof redeemRewardSchema
>['params'];
