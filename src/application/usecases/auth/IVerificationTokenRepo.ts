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
  markUsed(token: VerificationToken): Promise<VerificationToken>;
  /** Mark every still-valid token of a type for a user as used. */
  invalidateAllForUser(userId: string, type: VerificationTokenType): Promise<void>;
}
