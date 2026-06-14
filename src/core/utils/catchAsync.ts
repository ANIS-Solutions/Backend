import { NextFunction /* RequestHandler, */, Request, Response } from 'express';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const catchAsync = <
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any,
>(
  fn: (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response,
    next: NextFunction,
  ) => Promise<any>,
) => {
  return (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response,
    next: NextFunction,
  ): Promise<any> => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};
