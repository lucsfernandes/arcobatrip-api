export type VerificationTokenType = "password_reset" | "email_verification";

export interface IVerificationToken {
  id: string;
  userId: string;
  tokenHash: string;
  type: VerificationTokenType;
  expiresAt: Date;
  usedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
