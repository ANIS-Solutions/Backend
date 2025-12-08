import { catchAsync } from '@utils/catchAsync';
import { RequestHandler } from 'express';
import { ZodSchema } from 'zod';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any -- will be checked later.*/

interface ValidationParses {
  body?: any;
  query?: any;
  params?: any;
}
export const authValidate = (schema: ZodSchema): RequestHandler =>
  catchAsync(async (req, res, next) => {
    const okay = (await schema.parseAsync({
      body: req.body ?? {},
      query: req.query ?? {},
      params: req.params ?? {},
    })) as ValidationParses;

    if (okay.body) req.body = okay.body;
    if (okay.query) req.query = okay.query;
    if (okay.params) req.params = okay.params;
    next();
  });
