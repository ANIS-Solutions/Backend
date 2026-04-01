import { z } from 'zod';
import { partial } from 'zod/mini';

export interface IChild {
  firstName: string;
  gender: boolean;
  hobbies: string[];
  dob: Date;
}

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
  }),
});

export type CreateChildBodyInput = z.infer<typeof createChildSchema>['body'];
export const getSingleChildSchema = z.object({
  params: z.object({
    childId: z.string(),
  }),
});
export type GetSingleChildParamsInput = z.infer<
  typeof getSingleChildSchema
>['params'];
export const updateChildSchema = z.object({
  params: z.object({
    childId: z.string(),
  }),
  body: partial(createChildSchema),
});
export type UpdateChildParamsInput = z.infer<
  typeof updateChildSchema
>['params'];

export type UpdateChildBodyInput = z.infer<typeof updateChildSchema>['body'];
