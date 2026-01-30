import { z } from 'zod';

import { QuestStatus } from './../models/questModel.js';

//  Common Helpers
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

//  Create Quest (Parent)
export const createQuestSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(120),

    description: z.string().trim().max(500).optional(),

    child: objectIdSchema,

    target: z.object({
      kind: z.enum(['quiz', 'reading', 'time', 'location', 'custom']),
      value: z.string().min(1),
    }),

    reward: z
      .object({
        type: z.enum(['points', 'gift']),
        value: z.string().min(1),
        points: z.number().min(1).optional(),
      })
      .superRefine((data, ctx) => {
        if (data.type === 'points' && !data.points) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Points are required when reward type is points',
            path: ['points'],
          });
        }
      }),

    schedule: z
      .object({
        startAt: z.coerce.date(),
        endAt: z.coerce.date(),
      })
      .refine((data) => data.endAt > data.startAt, {
        message: 'endAt must be after startAt',
        path: ['endAt'],
      })
      .refine((data) => data.startAt >= new Date(), {
        message: 'startAt cannot be in the past',
        path: ['startAt'],
      }),
  }),
});

export type CreateQuestInput = z.infer<typeof createQuestSchema>['body'];

//Get All Quests
export const getAllQuestsSchema = z.object({
  query: z.object({
    status: z
      .enum(Object.values(QuestStatus) as [QuestStatus, ...QuestStatus[]])
      .optional(),
    child: objectIdSchema.optional(),
  }),
});

export type GetAllQuestsInput = z.infer<typeof getAllQuestsSchema>['query'];

//    Start Quest (Child)
export const startQuestSchema = z.object({
  params: z.object({
    questId: objectIdSchema,
  }),
});
export type startQuestInput = z.infer<typeof startQuestSchema>['params'];

//    Complete Quest (Child)
export const completeQuestSchema = z.object({
  params: z.object({
    questId: objectIdSchema,
  }),
});

//    Validate Quest (Parent)
export const validateQuestSchema = z.object({
  params: z.object({
    questId: objectIdSchema,
  }),

  body: z.object({
    isApproved: z.boolean(),
  }),
});

//    Cancel Quest (Parent)
export const cancelQuestSchema = z.object({
  params: z.object({
    questId: objectIdSchema,
  }),
});
