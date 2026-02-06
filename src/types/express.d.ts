import { IParent } from '@modules/auth/authModel';
import { JwtPayload } from 'jsonwebtoken';

import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload | IParent | undefined;
      cookies: Record<string, string> | { refreshToken: string };
    }
  }
}
