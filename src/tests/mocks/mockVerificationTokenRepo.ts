import {
  CreateVerificationTokenData,
  IVerificationTokenRepo,
} from "../../application/usecases/auth/IVerificationTokenRepo";
import { VerificationTokenType } from "../../domain/entities/VerificationToken/IVerificationToken";
import { VerificationToken } from "../../domain/entities/VerificationToken/verification.token.entity";

/** Optional overrides when seeding a token directly in tests. */
export interface SeedTokenOptions {
  userId: string;
  tokenHash: string;
  type: VerificationTokenType;
  expiresAt?: Date;
  createdAt?: Date;
  usedAt?: Date | null;
  attempts?: number;
}

/** In-memory {@link IVerificationTokenRepo} — no DB, deterministic ordering. */
export class MockVerificationTokenRepo implements IVerificationTokenRepo {
  public tokens: VerificationToken[] = [];
  private seq = 0;

  async create(data: CreateVerificationTokenData): Promise<VerificationToken> {
    const token = {
      id: `vt-${++this.seq}`,
      userId: data.userId,
      tokenHash: data.tokenHash,
      type: data.type,
      expiresAt: data.expiresAt,
      usedAt: null,
      attempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as VerificationToken;
    this.tokens.push(token);
    return token;
  }

  async findValidByHash(
    tokenHash: string,
    type: VerificationTokenType
  ): Promise<VerificationToken | null> {
    const now = Date.now();
    return (
      this.tokens.find(
        t =>
          t.tokenHash === tokenHash &&
          t.type === type &&
          !t.usedAt &&
          t.expiresAt.getTime() > now
      ) ?? null
    );
  }

  async findLatestForUser(
    userId: string,
    type: VerificationTokenType
  ): Promise<VerificationToken | null> {
    return this.sortedDesc(userId, type)[0] ?? null;
  }

  async findActiveForUser(
    userId: string,
    type: VerificationTokenType
  ): Promise<VerificationToken | null> {
    const now = Date.now();
    return (
      this.sortedDesc(userId, type).find(
        t => !t.usedAt && t.expiresAt.getTime() > now
      ) ?? null
    );
  }

  async markUsed(token: VerificationToken): Promise<VerificationToken> {
    token.usedAt = new Date();
    return token;
  }

  async incrementAttempts(token: VerificationToken): Promise<VerificationToken> {
    token.attempts += 1;
    return token;
  }

  async invalidateAllForUser(
    userId: string,
    type: VerificationTokenType
  ): Promise<void> {
    for (const t of this.tokens) {
      if (t.userId === userId && t.type === type && !t.usedAt) {
        t.usedAt = new Date();
      }
    }
  }

  // Test helpers ------------------------------------------------------------

  /** Insert a fully-formed token with fine-grained control over timestamps. */
  seed(options: SeedTokenOptions): VerificationToken {
    const token = {
      id: `vt-${++this.seq}`,
      userId: options.userId,
      tokenHash: options.tokenHash,
      type: options.type,
      expiresAt: options.expiresAt ?? new Date(Date.now() + 15 * 60 * 1000),
      usedAt: options.usedAt ?? null,
      attempts: options.attempts ?? 0,
      createdAt: options.createdAt ?? new Date(),
      updatedAt: new Date(),
    } as VerificationToken;
    this.tokens.push(token);
    return token;
  }

  clear(): void {
    this.tokens = [];
    this.seq = 0;
  }

  private sortedDesc(
    userId: string,
    type: VerificationTokenType
  ): VerificationToken[] {
    return this.tokens
      .filter(t => t.userId === userId && t.type === type)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
