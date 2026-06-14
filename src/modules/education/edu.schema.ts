import z from 'zod';

export const DayEnum = z.enum([
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]);
export const EduTypeEnum = z.enum(['SCHOOL', 'COURSE', 'PRIVATE_LESSON']);
export const TimeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/; // HH:MM
export const scheduleItemSchema = z
  .object({
    title: z.string().min(1, 'Subject title is required'),
    type: EduTypeEnum.default('SCHOOL'),
    day: DayEnum,
    startTime: z.string().regex(TimeRegex, 'Format must be HH:MM'),
    endTime: z.string().regex(TimeRegex, 'Format must be HH:MM'),
  })
  .refine((item) => item.endTime > item.startTime, {
    message: 'End time must be after Start time',
    path: ['endTime'],
  });
export const eduSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    location: z.string().trim().optional(),
    description: z.string().max(500).optional(),
    isActive: z.boolean().default(true),
    schedule: z.array(scheduleItemSchema).default([]),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'Term End Date must be after Start Date',
    path: ['endDate'],
  });
export type IEdu = z.infer<typeof eduSchema>;
export type IScheduleItem = z.infer<typeof scheduleItemSchema>;
export const addEduRequestSchema = z.object({
  body: eduSchema,
});

export type AddEduBodyInput = z.infer<typeof addEduRequestSchema>['body'];
// export const addEduSchema = z.object({
//   body: z
//     .object({
//       name: z.string().trim().min(2, 'Name must be at least 2 characters'),
//       startDate: z.coerce.date(),
//       endDate: z.coerce.date(),

//       location: z.string().trim().optional(),
//       description: z.string().max(500).optional(),

//       schedule: z
//         .array(
//           z
//             .object({
//               title: z.string().min(1, 'Subject title is required'),
//               type: z
//                 .enum(['SCHOOL', 'COURSE', 'PRIVATE_LESSON'])
//                 .default('SCHOOL'),
//               day: z.enum([
//                 'Sunday',
//                 'Monday',
//                 'Tuesday',
//                 'Wednesday',
//                 'Thursday',
//                 'Friday',
//                 'Saturday',
//               ]),
//               startTime: z
//                 .string()
//                 .regex(
//                   /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
//                   'Format must be HH:MM',
//                 ),
//               endTime: z
//                 .string()
//                 .regex(
//                   /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
//                   'Format must be HH:MM',
//                 ),
//             })
//             .refine((item) => item.endTime > item.startTime, {
//               message: 'End time must be after Start time',
//               path: ['endTime'],
//             }),
//         )
//         .optional()
//         .default([]),
//     })
//     .refine((data) => data.endDate > data.startDate, {
//       message: 'Term End Date must be after Start Date',
//       path: ['endDate'],
//     }),
// });

// export type AddEduInput = z.infer<typeof addEduSchema>['body'];
// name: string;
// startDate: Date;
// endDate: Date;
// schedule: {
//     title: string;
//     type: "SCHOOL" | "COURSE" | "PRIVATE_LESSON";
//     day: "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
//     startTime: string;
//     endTime: string;
// }[];
// location?: string | undefined;
// description?: string | undefined;
