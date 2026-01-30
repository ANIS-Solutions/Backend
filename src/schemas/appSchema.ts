import { z } from 'zod';

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const getAllAppsSchema = z.object({
  params: z.object({
    childId: objectIdSchema,
  }),
});

export type GetAllAppsInput = z.infer<typeof getAllAppsSchema>['params'];

export const getSingleAppSchema = z.object({
  params: z.object({
    childId: objectIdSchema,
    appId: objectIdSchema,
  }),
});

export type getSingleAppInput = z.infer<typeof getSingleAppSchema>['params'];

export const blockAppSchema = z.object({
  body: z.object({
    childId: objectIdSchema,
    appId: objectIdSchema,
  }),
});

export type blockAppInput = z.infer<typeof blockAppSchema>['body'];

export const unblockAppSchema = z.object({
  body: z.object({
    childId: objectIdSchema,
    appId: objectIdSchema,
  }),
});

export type unBlockAppInput = z.infer<typeof unblockAppSchema>['body'];
