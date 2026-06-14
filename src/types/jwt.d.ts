import 'jsonwebtoken';

import IJwtPayload from '@anis/shared';

declare module 'jsonwebtoken' {
  export interface JwtPayload extends IJwtPayload {}
}
