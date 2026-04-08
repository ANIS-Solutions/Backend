import { IParent } from '@/modules/parent/parent.model';
import { JwtPayload } from 'jsonwebtoken';

export interface IAuthUser {
  id: string;
  email: string;
  isActive: boolean;
  role: 'PARENT' | 'CHILD';
}

declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
      cookies: {
        refreshToken?: string;
        // eslint-disable-next-line
        [key: string]: any;
      };
    }
  }
}
export {};
