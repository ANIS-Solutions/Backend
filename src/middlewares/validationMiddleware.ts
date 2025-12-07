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
    // try {
    const okay = (await schema.parseAsync({
      body: req.body ?? {},
      query: req.query ?? {},
      params: req.params ?? {},
    })) as ValidationParses;
    // if (!okay) return next(new AppError('', HttpStatusCode.BAD_REQUEST));
    // console.log('before: ');
    // console.log(req.body);
    // console.log('okay');
    // console.log(okay);

    // console.log('after: req.body');
    // console.log(req.body);

    if (okay.body) req.body = okay.body;
    if (okay.query) req.query = okay.query;
    if (okay.params) req.params = okay.params;
    next();
    // } catch (error) {
    //   if (error instanceof ZodError) {
    //     return res.status(HttpStatusCode.BAD_REQUEST).json({
    //       success: false,
    //       message: 'Validation failed',
    //       errors: error.issues.map((err) => ({
    //         field: err.path.join('.'),
    //         message: err.message,
    //       })),
    //     });
    //   }
    //   next(error);
    // }
  });
