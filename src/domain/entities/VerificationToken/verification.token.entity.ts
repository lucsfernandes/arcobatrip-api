import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "../base.entity";
import { VerificationTokenType } from "./IVerificationToken";

/**
 * Single-use token for `password_reset` / `email_verification` flows. Only the
 * SHA-256 hash of the raw token is stored — the raw token is only ever sent in
 * the email link. A token is "valid" while `used_at` is null and `expires_at`
 * is in the future.
 */
@Entity("verification_tokens")
export class VerificationToken extends BaseEntity {
  @Column({ name: "user_id", type: "varchar" })
  @Index()
  public userId!: string;

  @Column({ name: "token_hash", type: "varchar" })
  @Index()
  public tokenHash!: string;

  @Column({ name: "type", type: "varchar" })
  public type!: VerificationTokenType;

  @Column({ name: "expires_at", type: "timestamp" })
  public expiresAt!: Date;

  @Column({ name: "used_at", type: "timestamp", nullable: true })
  public usedAt?: Date | null;
}
