import { objectIdRegex, QuestProgress } from '@anis/shared';
import z from 'zod';

export const addQuestSchema = z.object({
  params: z.object({
    childId: z.string().regex(objectIdRegex),
  }),
  body: z.object({
    title: z.string(),
    description: z.string(),
    type: z.string(),
    points: z.number().optional().default(0),
    stats: z.enum(QuestProgress).optional().default(QuestProgress.NOT_STARTED),
    deadline: z.coerce.date(),
  }),
});

export type AddQuestParamsInput = z.infer<typeof addQuestSchema>['params'];
export type AddQuestBodyInput = z.infer<typeof addQuestSchema>['body'];

export const updateQuestSchema = z.object({
  params: z.object({
    childId: z.string().regex(objectIdRegex),
    questId: z.string().regex(objectIdRegex),
  }),
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    points: z.number().optional(),
    type: z.string().optional(),
    deadline: z.coerce.date().optional(),
  }),
});

export type UpdateQuestParamsInput = z.infer<
  typeof updateQuestSchema
>['params'];
export type UpdateQuestBodyInput = z.infer<typeof updateQuestSchema>['body'];

export const startQuestSchema = z.object({
  params: z.object({
    childId: z.string().regex(objectIdRegex),
    questId: z.string().regex(objectIdRegex),
  }),
});

export type StartQuestParamsInput = z.infer<typeof startQuestSchema>['params'];
export const cancelQuestSchema = z.object({
  params: z.object({
    childId: z.string().regex(objectIdRegex),
    questId: z.string().regex(objectIdRegex),
  }),
});

export type CancelQuestParamsInput = z.infer<
  typeof cancelQuestSchema
>['params'];

export const completeQuestSchema = z.object({
  params: z.object({
    childId: z.string().regex(objectIdRegex),
    questId: z.string().regex(objectIdRegex),
  }),
});

export type CompleteQuestParamsInput = z.infer<
  typeof completeQuestSchema
>['params'];

export const stopQuestSchema = z.object({
  params: z.object({
    childId: z.string().regex(objectIdRegex),
    questId: z.string().regex(objectIdRegex),
  }),
});

export type StopQuestParamsInput = z.infer<typeof stopQuestSchema>['params'];

export const getQuestSchema = z.object({
  params: z.object({
    childId: z.string().regex(objectIdRegex),
    questId: z.string().regex(objectIdRegex),
  }),
});

export type GetQuestParamsInput = z.infer<typeof getQuestSchema>['params'];

export const getAllQuestSchema = z.object({
  params: z.object({
    childId: z.string().regex(objectIdRegex),
  }),
});

export type GetAllQuestParamsInput = z.infer<
  typeof getAllQuestSchema
>['params'];
