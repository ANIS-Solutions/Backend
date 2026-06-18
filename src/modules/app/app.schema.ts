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
  body: z.object({
    packagesId: z.array(z.string()),
  }),
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

export const pingAppUsageSchema = z.object({
  params: paramsSchema.omit({ childId: true }),
  body: z.object({
    duration: z.number(),
    timestamp: z.coerce.date(),
    isLive: z.boolean(),
    additionalData: z
      .object({
        youtubeVideoId: z.string().optional(),
        screenshotUrl: z.url().optional(),
      })
      .optional(),
  }),
});

export type PingAppUsageParams = z.infer<typeof pingAppUsageSchema>['params'];
export type PingAppUsageBody = z.infer<typeof pingAppUsageSchema>['body'];

export const addDailyUsageSchema = z.object({
  body: z.object({
    date: z.coerce.date(),
    // date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
    totalScreenTimeMinutes: z.number().min(0),
    apps: z.array(
      z.object({
        packageName: z.string(),
        totalAppTimeMinutes: z.number().min(0),
      }),
    ),
  }),
});

export type AddDailyUsageInput = z.infer<typeof addDailyUsageSchema>['body'];

export const getDailyUsageSchema = z.object({
  params: z.object({
    childId: z.string(),
  }),
  query: z
    .object({
      sort: z.enum(['asc', 'desc']).optional().default('desc'),
      limit: z.coerce.number().min(1).max(100).optional().default(30),
      page: z.coerce.number().min(1).optional().default(1),
    })
    .optional(),
});

export type GetDailyUsageParams = z.infer<typeof getDailyUsageSchema>['params'];
export type GetDailyUsageQuery = z.infer<typeof getDailyUsageSchema>['query'];
