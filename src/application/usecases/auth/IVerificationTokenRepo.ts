import { VerificationToken } from "../../../domain/entities/VerificationToken/verification.token.entity";
import { VerificationTokenType } from "../../../domain/entities/VerificationToken/IVerificationToken";

export interface CreateVerificationTokenData {
  userId: string;
  tokenHash: string;
  type: VerificationTokenType;
  expiresAt: Date;
}

export interface IVerificationTokenRepo {
  create(data: CreateVerificationTokenData): Promise<VerificationToken>;
  /** A non-used, non-expired token matching the hash + type, or null. */
  findValidByHash(
    tokenHash: string,
    type: VerificationTokenType
  ): Promise<VerificationToken | null>;
  /**
   * Most recent token of a type for a user regardless of state (used/expired) —
   * used to enforce the resend cooldown.
   */
  findLatestForUser(
    userId: string,
    type: VerificationTokenType
  ): Promise<VerificationToken | null>;
  /**
   * Most recent still-valid (non-used, non-expired) token of a type for a user.
   * Used to verify short numeric codes scoped to the authenticated user.
   */
  findActiveForUser(
    userId: string,
    type: VerificationTokenType
  ): Promise<VerificationToken | null>;
  markUsed(token: VerificationToken): Promise<VerificationToken>;
  /**
   * Atomically increment the token's `attempts` counter in the database and
   * return the resulting value. Implementations MUST perform this as a single
   * `UPDATE ... SET attempts = attempts + 1 RETURNING attempts` so concurrent
   * verify requests cannot both read a stale value and bypass the attempt
   * ceiling. The passed entity's `attempts` is refreshed to the settled value.
   */
  incrementAttempts(token: VerificationToken): Promise<number>;
  /** Mark every still-valid token of a type for a user as used. */
  invalidateAllForUser(userId: string, type: VerificationTokenType): Promise<void>;
}
