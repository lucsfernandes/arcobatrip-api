export interface TokenPayload {
  userId: string;
  email: string;
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

export interface ITokenService {
  generateToken(payload: TokenPayload): string;
  verifyToken(token: string): DecodedToken | null;
  invalidateToken(token: string): Promise<void>;
  isTokenBlacklisted(token: string): Promise<boolean>;
}
