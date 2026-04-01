import z from 'zod';

const paramsSchema = z.object({
  childId: z.string(),
  appId: z.string(),
});
export const addAppSchema = z.object({
  body: z.object({
    name: z.string(),
    storeId: z.string(),
    category: z.array(z.string()),
    iconUrl: z.url(),
    about: z.string(),
    childId: z.string(),
  }),
});

export type AddAppInput = z.infer<typeof addAppSchema>['body'];

export const removeAppSchema = z.object({
  params: paramsSchema,
});
export type RemoveAppInput = z.infer<typeof removeAppSchema>['params'];
export const updateAppSchema = z.object({
  params: paramsSchema,
  body: z.object({
    name: z.string().optional(),
    iconUrl: z.string().optional(),
    about: z.string().optional(),
    category: z.array(z.string()).optional(),
  }),
});
export type UpdateAppInput = z.infer<typeof updateAppSchema>;
export const toggleBlockSchema = z.object({
  params: paramsSchema,
  body: z.object({
    isBlocked: z.boolean(),
  }),
});
export type ToggleBlockInput = z.infer<typeof toggleBlockSchema>;

export const setLimitSchema = z.object({
  params: paramsSchema,
  body: z.object({
    dailyLimit: z.number().min(0, 'Limit cannot be negative'),
  }),
});
export type SetLimitInput = z.infer<typeof setLimitSchema>;

export const getAppSchema = z.object({
  params: paramsSchema,
});

export type GetAppInput = z.infer<typeof getAppSchema>['params'];

export const getAppsSchema = z.object({
  params: paramsSchema.omit({ appId: true }),
});

export type GetAppsInput = z.infer<typeof getAppsSchema>['params'];
