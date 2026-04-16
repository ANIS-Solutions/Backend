import z from 'zod';

const paramsSchema = z.object({
  childId: z.string(),
  packageId: z.string(),
});
export const addAppSchema = z.object({
  body: z.object({
    packageId: z.string(),
  }),
});

export type AddAppInput = z.infer<typeof addAppSchema>['body'];
export const addBulkAppsSchema = z.object({
  body: z.array(
    z.object({
      packageId: z.string(),
    }),
  ),
});

export type AddBulkAppsInput = z.infer<typeof addBulkAppsSchema>['body'];
export const removeAppSchema = z.object({
  params: paramsSchema,
});
export type RemoveAppInput = z.infer<typeof removeAppSchema>['params'];

export const toggleBlockSchema = z.object({
  params: paramsSchema,
  body: z.object({
    isBlocked: z.boolean(),
  }),
});
export type ToggleBlockParamsInput = z.infer<
  typeof toggleBlockSchema
>['params'];
export type ToggleBlockBodyInput = z.infer<typeof toggleBlockSchema>['body'];

export const setLimitSchema = z.object({
  params: paramsSchema,
  body: z.object({
    dailyLimit: z.number().min(0, 'Limit cannot be negative'),
  }),
});
export type SetLimitParamsInput = z.infer<typeof setLimitSchema>['params'];
export type SetLimitBodyInput = z.infer<typeof setLimitSchema>['body'];

export const getAppSchema = z.object({
  params: paramsSchema,
});

export type GetAppInput = z.infer<typeof getAppSchema>['params'];

export const getAppsSchema = z.object({
  params: paramsSchema.omit({ packageId: true }),
});

export type GetAppsInput = z.infer<typeof getAppsSchema>['params'];
