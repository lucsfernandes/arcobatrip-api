import jwt, { SignOptions } from "jsonwebtoken";
import { DecodedToken, ITokenService, TokenPayload } from "../../application/usecases/auth/ITokenService";
import { env } from "../../main/config/env";

export class TokenService implements ITokenService {
  private blacklistedTokens: Set<string> = new Set();

  generateToken(payload: TokenPayload): string {
    const secret = env.JWT_SECRET;
    const options: SignOptions = { 
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
    };
    return jwt.sign(payload, secret, options);
  }

  verifyToken(token: string): DecodedToken | null {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as DecodedToken;
      return decoded;
    } catch {
      return null;
    }
  }

  async invalidateToken(token: string): Promise<void> {
    // Em produção, usar Redis ou banco de dados para armazenar tokens invalidados
    this.blacklistedTokens.add(token);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    return this.blacklistedTokens.has(token);
  }
}

// Instância singleton do serviço
export const tokenService = new TokenService();
