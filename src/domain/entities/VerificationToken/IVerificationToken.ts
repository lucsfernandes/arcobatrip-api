export type VerificationTokenType =
  | "password_reset"
  | "email_verification"
  | "phone_verification";

export interface IVerificationToken {
  id: string;
  userId: string;
  tokenHash: string;
  type: VerificationTokenType;
  expiresAt: Date;
  usedAt?: Date | null;
  /** Failed validation attempts — used to lock short numeric codes (phone). */
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}
