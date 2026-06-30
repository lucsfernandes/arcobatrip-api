import { IEmailService } from "./email/IEmailService";
import { IVerificationTokenRepo } from "../usecases/auth/IVerificationTokenRepo";
import { generateRawToken, hashToken } from "../utils/token";
import { env } from "../../main/config/env";
import logger from "../../main/logger";

/** Minimal account shape the email flows need. */
export interface AccountEmailUser {
  id: string;
  email: string;
  fullName: string;
}

/**
 * Account lifecycle → transactional email fan-out (welcome / verification /
 * password reset). Mirrors {@link NotificationEmitter}'s resilience style:
 * every failure is logged and swallowed so it can never break the primary
 * request (signup, forgot-password, etc.). Only the SHA-256 hash of each token
 * is persisted — the raw token travels only in the email link.
 */
export class AccountEmailEmitter {
  constructor(
    private readonly emailService: IEmailService,
    private readonly verificationTokenRepo: IVerificationTokenRepo
  ) {}

  /** New account → welcome email + email-verification link. */
  async onSignup(user: AccountEmailUser): Promise<void> {
    try {
      await this.emailService.sendWelcome(user.email, { name: user.fullName });
      await this.sendVerification(user);
    } catch (error) {
      logger.error("[AccountEmailEmitter.onSignup]", error);
    }
  }

  /** (Re)issue an email-verification link and send it. */
  async sendVerification(user: AccountEmailUser): Promise<void> {
    try {
      await this.verificationTokenRepo.invalidateAllForUser(user.id, "email_verification");

      const rawToken = generateRawToken();
      const expiresAt = new Date(
        Date.now() + env.EMAIL_VERIFICATION_TOKEN_TTL_MIN * 60 * 1000
      );

      await this.verificationTokenRepo.create({
        userId: user.id,
        tokenHash: hashToken(rawToken),
        type: "email_verification",
        expiresAt,
      });

      const verifyUrl = `${env.APP_URL}/verify-email?token=${rawToken}`;
      await this.emailService.sendEmailVerification(user.email, {
        name: user.fullName,
        verifyUrl,
      });
    } catch (error) {
      logger.error("[AccountEmailEmitter.sendVerification]", error);
    }
  }

  /** Issue a single-use password-reset link and send it. */
  async sendPasswordReset(user: AccountEmailUser): Promise<void> {
    try {
      await this.verificationTokenRepo.invalidateAllForUser(user.id, "password_reset");

      const rawToken = generateRawToken();
      const expiresAt = new Date(
        Date.now() + env.PASSWORD_RESET_TOKEN_TTL_MIN * 60 * 1000
      );

      await this.verificationTokenRepo.create({
        userId: user.id,
        tokenHash: hashToken(rawToken),
        type: "password_reset",
        expiresAt,
      });

      const resetUrl = `${env.APP_URL}/reset-password?token=${rawToken}`;
      await this.emailService.sendPasswordReset(user.email, {
        name: user.fullName,
        resetUrl,
      });
    } catch (error) {
      logger.error("[AccountEmailEmitter.sendPasswordReset]", error);
    }
  }
}
