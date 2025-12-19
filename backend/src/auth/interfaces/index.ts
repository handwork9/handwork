import { UserRole } from '../../common/enums';

export interface JwtPayload {
  sub: string; // user id
  phone: string;
  email?: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
