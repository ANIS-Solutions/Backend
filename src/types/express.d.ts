import { IParent } from '@models/authModels';
import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload | IParent | undefined;
    }
  }
}
