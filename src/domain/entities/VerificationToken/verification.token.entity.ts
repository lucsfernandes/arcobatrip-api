import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "../base.entity";
import { VerificationTokenType } from "./IVerificationToken";

/**
 * Single-use token for `password_reset` / `email_verification` /
 * `phone_verification` flows. Only the SHA-256 hash of the raw token/code is
 * stored — the raw value is only ever sent in the email link (or, for phone, the
 * 6-digit code in the email body). A token is "valid" while `used_at` is null and
 * `expires_at` is in the future. `attempts` counts failed validations so short
 * numeric codes can be locked after too many tries.
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

  @Column({ name: "attempts", type: "int", default: 0 })
  public attempts!: number;
}
