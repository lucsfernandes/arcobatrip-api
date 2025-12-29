import { DecodedToken, ITokenService, TokenPayload } from "../../src/application/usecases/auth/ITokenService";

export class MockTokenService implements ITokenService {
  private blacklistedTokens: Set<string> = new Set();
  private tokenCounter = 0;

  generateToken(payload: TokenPayload): string {
    this.tokenCounter++;
    return `mock-token-${this.tokenCounter}-${payload.userId}`;
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

  async invalidateToken(token: string): Promise<void> {
    this.blacklistedTokens.add(token);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    return this.blacklistedTokens.has(token);
  }

  // Métodos auxiliares para testes
  clear(): void {
    this.blacklistedTokens.clear();
    this.tokenCounter = 0;
  }
}
