import { IParent } from '@/modules/auth/auth.model';
import { JwtPayload } from 'jsonwebtoken';

// import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload | IParent | undefined;
      cookies: {
        refreshToken?: string;
        // eslint-disable-next-line
        [key: string]: any;
      };
    }
  }
}
export {};
