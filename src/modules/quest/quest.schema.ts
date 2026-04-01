import { z } from 'zod';

import { QuestStatus } from './quest.model.js';

//  Common Helpers
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

//  Create Quest (Parent)
export const addQuestSchema = z.object({
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
            code: 'custom',
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

export type AddQuestBodyInput = z.infer<typeof addQuestSchema>['body'];
