import 'jsonwebtoken';

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    userId: string | undefined;
    role: string | undefined;
  }
}
