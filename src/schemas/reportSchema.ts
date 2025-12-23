import z from 'zod';

export const generateReportSchema = z.object({
  body: z.object({
    childId: z.string().min(1, 'Child ID is required to link the report.'),
    report: z.string().min(10, 'Report content is too short.'),
  }),
});

export type GenerateReportInput = z.infer<typeof generateReportSchema>['body'];

export const getReportSchema = z.object({
  query: z.object({
    childId: z.string().optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});

export type GetReportsInput = z.infer<typeof getReportSchema>['query'];
