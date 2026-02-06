import { DecodedToken, ITokenService, TokenPair, TokenPayload } from "../../application/usecases/auth/ITokenService";

export class MockTokenService implements ITokenService {
  private blacklistedTokens: Set<string> = new Set();
  private blacklistedRefreshTokens: Set<string> = new Set();
  private tokenCounter = 0;
  private refreshTokenCounter = 0;

  generateToken(payload: TokenPayload): string {
    this.tokenCounter++;
    return `mock-token-${this.tokenCounter}-${payload.userId}`;
  }

  generateRefreshToken(payload: TokenPayload): string {
    this.refreshTokenCounter++;
    return `mock-refresh-token-${this.refreshTokenCounter}-${payload.userId}`;
  }

  generateTokenPair(payload: TokenPayload): TokenPair {
    return {
      accessToken: this.generateToken(payload),
      refreshToken: this.generateRefreshToken(payload)
    };
  }

  verifyToken(token: string): DecodedToken | null {
    if (this.blacklistedTokens.has(token)) {
      return null;
    }

    // Extrai userId do token mockado
    const match = token.match(/mock-token-\d+-(.+)/);
    if (!match) return null;

    return {
      userId: match[1],
      email: 'test@test.com',
      iat: Date.now() / 1000,
      exp: Date.now() / 1000 + 3600
    };
  }

  verifyRefreshToken(token: string): DecodedToken | null {
    if (this.blacklistedRefreshTokens.has(token)) {
      return null;
    }

    // Extrai userId do refresh token mockado
    const match = token.match(/mock-refresh-token-\d+-(.+)/);
    if (!match) return null;

    return {
      userId: match[1],
      email: 'test@test.com',
      iat: Date.now() / 1000,
      exp: Date.now() / 1000 + 604800 // 7 dias
    };
  }

  async invalidateToken(token: string): Promise<void> {
    this.blacklistedTokens.add(token);
  }

  async invalidateRefreshToken(token: string): Promise<void> {
    this.blacklistedRefreshTokens.add(token);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    return this.blacklistedTokens.has(token);
  }

  async isRefreshTokenBlacklisted(token: string): Promise<boolean> {
    return this.blacklistedRefreshTokens.has(token);
  }

  // Métodos auxiliares para testes
  clear(): void {
    this.blacklistedTokens.clear();
    this.blacklistedRefreshTokens.clear();
    this.tokenCounter = 0;
    this.refreshTokenCounter = 0;
  }
}
