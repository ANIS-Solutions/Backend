import { z } from 'zod';

export const createChildSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .trim()
      .min(2, 'First name required')
      .max(14, 'No name more than 14 characters')
      .regex(
        /^[\p{L}\s'-]+$/u,
        'First name contains non-alphabetic characters',
      ),
    lastName: z
      .string()
      .trim()
      .min(2, 'Last name required')
      .max(14, 'No name more than 14 characters')
      .regex(/^[\p{L}\s'-]+$/u, 'Last name contains non-alphabetic characters'),

    gender: z.boolean().refine((val) => val !== undefined, {
      message: 'Gender is required',
    }),

    hobbies: z.array(z.string().min(1, 'Hobby cannot be empty')).optional(),

    dob: z.coerce.date().refine(
      (date) => {
        const today = new Date();
        const age = today.getFullYear() - date.getFullYear();
        return age < 18 && age > 0;
      },
      { message: 'Child age must be less than 18 years old' },
    ),
    parent: z.string().optional(),
  }),
});

export type CreateChildInput = z.infer<typeof createChildSchema>['body'];
