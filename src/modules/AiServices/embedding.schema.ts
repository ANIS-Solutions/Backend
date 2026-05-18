import { objectIdRegex, PromptAction, PromptsStrictness } from '@anis/shared';
import z from 'zod';

export const addPromptSchema = z.object({
  params: z.object({
    childId: z.string().regex(objectIdRegex),
  }),
  body: z.object({
    title: z.string(),
    key: z.string(),
    description: z.string(),
    LevelOfStrictness: z.enum(PromptsStrictness),
    threat: z.boolean(),
    action: z.enum(PromptAction),
  }),
});
export type AddPromptParamsInput = z.infer<typeof addPromptSchema>['params'];
export type AddPromptBodyInput = z.infer<typeof addPromptSchema>['body'];

export const getPromptSchema = z.object({
  params: z.object({
    childId: z.string().regex(objectIdRegex),
    promptId: z.string().regex(objectIdRegex),
  }),
});
export type GetPromptParamsInput = z.infer<typeof getPromptSchema>['params'];

export const updatePromptSchema = z.object({
  params: z.object({
    childId: z.string().regex(objectIdRegex),
    promptId: z.string().regex(objectIdRegex),
  }),
  body: z.object({
    title: z.string(),
    key: z.string(),
    description: z.string(),
    LevelOfStrictness: z.enum(PromptsStrictness),
    threat: z.boolean(),
    action: z.enum(PromptAction),
  }),
});
export type UpdatePromptParamsInput = z.infer<
  typeof updatePromptSchema
>['params'];
export type UpdatePromptBodyInput = z.infer<typeof updatePromptSchema>['body'];

export const deletePromptSchema = z.object({
  params: z.object({
    childId: z.string().regex(objectIdRegex),
    promptId: z.string().regex(objectIdRegex),
  }),
});
export type DeletePromptParamsInput = z.infer<
  typeof deletePromptSchema
>['params'];

export const getAllPromptSchema = z.object({
  params: z.object({
    childId: z.string().regex(objectIdRegex),
  }),
});
export type GetAllPromptParamsInput = z.infer<
  typeof getAllPromptSchema
>['params'];
