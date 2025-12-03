import { RegisterInput, registerSchema } from '@controllers/authController';
import HttpStatusCode from '@utils/HttpStatusCode';
import { RequestHandler } from 'express';
import { ZodError } from 'zod';

export const authValidate =
  (schema: typeof registerSchema): RequestHandler =>
  async (req, res, next) => {
    try {
      await schema.parseAsync({
        body: req.body as RegisterInput,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: 'Validation failed',
          errors: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
