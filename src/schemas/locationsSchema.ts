import z from 'zod';

export const locationsSchema = z.object({
  body: z.object({ title: z.string(''), address: z.string() }),
});

export type LocationsInput = z.infer<typeof locationsSchema>['body'];
