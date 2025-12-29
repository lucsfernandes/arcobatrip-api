export interface TokenPayload {
  userId: string;
  email: string;
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ITokenService {
  generateToken(payload: TokenPayload): string;
  generateTokenPair(payload: TokenPayload): TokenPair;
  generateRefreshToken(payload: TokenPayload): string;
  verifyToken(token: string): DecodedToken | null;
  verifyRefreshToken(token: string): DecodedToken | null;
  invalidateToken(token: string): Promise<void>;
  invalidateRefreshToken(token: string): Promise<void>;
  isTokenBlacklisted(token: string): Promise<boolean>;
  isRefreshTokenBlacklisted(token: string): Promise<boolean>;
}
