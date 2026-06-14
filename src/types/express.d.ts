import { IJwtPayload, UserRole } from '@anis/shared';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      // user?: IAuthUser;
      user?: jwt.JwtPayload & IJwtPayload;
      cookies: {
        refreshToken?: string;
        // eslint-disable-next-line
        [key: string]: any;
      };
    }
  }
}
export {};
