import { objectIdRegex } from '@anis/shared';
import z from 'zod';

export const parentIdParam = {
  parentId: z
    .string()
    .regex(
      objectIdRegex,
      'Invalid Parent ID format. Must be a valid ObjectId.',
    ),
};

export const getAllNotificationSchema = z.object({
  params: z.object({
    // ...parentIdParam,
    limit: z.number().optional(),
    page: z.number().optional(),
  }),
});

export type GetAllNotificationParamsInput = z.infer<
  typeof getAllNotificationSchema
>['params'];

export const deleteNotificationSchema = z.object({
  params: z.object({
    notificationId: z
      .string()
      .regex(
        objectIdRegex,
        'Invalid notification ID format. Must be a valid ObjectId.',
      ),
  }),
});

export type DeleteNotificationParamsInput = z.infer<
  typeof deleteNotificationSchema
>['params'];

export const deleteAllNotificationSchema = z.object({
  // params: z.object({ ...parentIdParam }),
});

export type DeleteAllNotificationParamsInput = z.infer<
  typeof deleteAllNotificationSchema
>['params'];

export const markAsReadNotificationSchema = z.object({
  params: z.object({
    notificationId: z
      .string()
      .regex(
        objectIdRegex,
        'Invalid notification ID format. Must be a valid ObjectId.',
      ),
  }),
});

export type MarkAsReadNotificationParamsInput = z.infer<
  typeof markAsReadNotificationSchema
>['params'];
