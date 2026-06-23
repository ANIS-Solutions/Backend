import { catchAsync } from '@/core/utils/catchAsync';
import { RequestHandler } from 'express';
import { ZodType } from 'zod';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any -- will be checked later.*/

interface ValidationParses {
  body?: any;
  query?: any;
  params?: any;
}
export const reqValidate = (schema: ZodType): RequestHandler =>
  catchAsync(async (req, res, next) => {
    const okay = (await schema.parseAsync({
      body: req.body ?? {},
      query: req.query ?? {},
      params: req.params ?? {},
    })) as ValidationParses;
    // logger.error(req.body);

    if (okay.body) {
      Object.assign(req.body, okay.body);
    }
    if (okay.query) {
      Object.defineProperty(req, 'query', {
        value: okay.query,
        writable: true,
      });
    }
    if (okay.params) {
      // Object.assign(req.params, okay.params);
      Object.defineProperty(req, 'params', {
        value: okay.params,
        writable: true,
      });
    }
    next();
  });
