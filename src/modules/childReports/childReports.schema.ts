import z from 'zod';

export const generateChildReportSchema = z.object({
  params: z.object({
    childId: z.string().min(1, 'Child ID is required'),
  }),
  body: z.object({
    sessionDocId: z
      .string()
      .min(1, 'Session document ID is required')
      .describe('The ChildSession._id to generate a report from'),
  }),
});

export type GenerateChildReportParams = z.infer<
  typeof generateChildReportSchema
>['params'];
export type GenerateChildReportBody = z.infer<
  typeof generateChildReportSchema
>['body'];

export const getChildReportsSchema = z.object({
  params: z.object({
    childId: z.string().min(1, 'Child ID is required'),
  }),
  query: z.object({
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .pipe(z.number().min(1).max(50))
      .optional(),
    page: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .pipe(z.number().min(1))
      .optional(),
  }),
});

export type GetChildReportsParams = z.infer<
  typeof getChildReportsSchema
>['params'];
export type GetChildReportsQuery = z.infer<
  typeof getChildReportsSchema
>['query'];

export const getChildReportSchema = z.object({
  params: z.object({
    childId: z.string().min(1, 'Child ID is required'),
    reportId: z.string().min(1, 'Report ID is required'),
  }),
});

export type GetChildReportParams = z.infer<
  typeof getChildReportSchema
>['params'];
