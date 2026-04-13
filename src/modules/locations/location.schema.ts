import { objectIdRegex } from '@anis/shared';
import z from 'zod';

export const childIdParam = {
  childId: z
    .string()
    .regex(objectIdRegex, 'Invalid Child ID format. Must be a valid ObjectId.'),
};

export const addLocationSchema = z.object({
  params: z.object({ ...childIdParam }),
  body: z.object({
    title: z.string(),
    address: z.string(),
    location: z.object({
      type: z.literal('Point'),
      coordinates: z.number().array().min(2).max(2),
    }),
    safeRadius: z.number(),
  }),
});

export type AddLocationParamsInput = z.infer<
  typeof addLocationSchema
>['params'];
export type AddLocationBodyInput = z.infer<typeof addLocationSchema>['body'];
export const updateLocationSchema = z.object({
  params: z.object({
    locId: z
      .string()
      .regex(
        objectIdRegex,
        'Invalid Location ID format. Must be a valid ObjectId.',
      ),
    ...childIdParam,
  }),
  body: z.object({
    title: z.string(),
    address: z.string(),
    location: z.object({
      type: z.literal('Point'),
      coordinates: z.number().array().min(2).max(2),
    }),
    safeRadius: z.number(),
  }),
});

export type UpdateLocationParamsInput = z.infer<
  typeof updateLocationSchema
>['params'];
export type UpdateLocationBodyInput = z.infer<
  typeof updateLocationSchema
>['body'];

export const removeLocationSchema = z.object({
  params: z.object({
    locId: z
      .string()
      .regex(
        objectIdRegex,
        'Invalid Location ID format. Must be a valid ObjectId.',
      ),
    ...childIdParam,
  }),
});

export type RemoveLocationParamsInput = z.infer<
  typeof removeLocationSchema
>['params'];

export const getLocationSchema = z.object({
  params: z.object({
    locId: z
      .string()
      .regex(
        objectIdRegex,
        'Invalid Location ID format. Must be a valid ObjectId.',
      ),
    ...childIdParam,
  }),
});

export type GetLocationParamsInput = z.infer<
  typeof getLocationSchema
>['params'];

export const getAllLocationSchema = z.object({
  params: z.object({ ...childIdParam }),
  query: z.object({
    coord: z
      .string()
      .optional()
      .transform((val, ctx) => {
        if (!val) return undefined;

        const match =
          /^\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)$/.exec(val);
        if (!match?.[1] || !match[2]) {
          ctx.addIssue({
            code: 'custom',
            message:
              'Invalid coordinate format. Expected (latitude,longitude).',
          });
          return z.NEVER;
        }

        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);

        if (lat < -90.0 || lat > 90.0 || lng < -180.0 || lng > 180.0) {
          ctx.addIssue({
            code: 'custom',
            message:
              'Coordinates out of bounds. Lat: [-90, 90], Lng: [-180, 180].',
          });
          return z.NEVER;
        }

        return { lat, lng };
      }),
  }),
});

export type GetAllLocationParamsInput = z.infer<
  typeof getAllLocationSchema
>['params'];
export type GetAllLocationQueryInput = z.infer<
  typeof getAllLocationSchema
>['query'];
export const telemetryTrackLocationSchema = z.object({
  params: z.object({ childId: z.string() }),
  body: z.object({
    lng: z.number().min(-180).max(180),
    lat: z.number().min(-90).max(90),
    batteryLevel: z.number().min(0).max(100).optional(),
  }),
});
export type TelemetryTrackLocationParamsInput = z.infer<
  typeof telemetryTrackLocationSchema
>['params'];
export type TelemetryTrackLocationBodyInput = z.infer<
  typeof telemetryTrackLocationSchema
>['body'];

export const streamTelemetrySchema = z.object({
  params: z.object({ childId: z.string() }),
});
export type StreamTelemetryParamsInput = z.infer<
  typeof streamTelemetrySchema
>['params'];

export const historyQuerySchema = z.object({
  params: z.object({
    childId: z.string(),
  }),
  query: z.object({
    hours: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 24)),
  }),
});

export type HistoryQueryInput = z.infer<typeof historyQuerySchema>['query'];
