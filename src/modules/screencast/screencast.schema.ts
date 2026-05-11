import { objectIdRegex } from '@anis/shared';
import z from 'zod';

export const screenCastRequestSchema = z.object({
  params: z.object({
    childId: z.string().regex(objectIdRegex),
  }),
});

export type screenCastRequestInput = z.infer<
  typeof screenCastRequestSchema
>['params'];
