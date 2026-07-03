import { IEmailService } from "./email/IEmailService";
import { IVerificationTokenRepo } from "../usecases/auth/IVerificationTokenRepo";
import { generateNumericCode, hashToken } from "../utils/token";
import { env } from "../../main/config/env";

/** Minimal account shape the phone-verification flow needs. */
export interface PhoneVerificationUser {
  id: string;
  email: string;
  fullName: string;
}

/** Outcome of a code request. `sent: false` means the resend cooldown is active. */
export interface RequestCodeResult {
  sent: boolean;
  /** When blocked, seconds the caller should wait before retrying. */
  retryAfterSeconds?: number;
}

/**
 * Issues and delivers the 6-digit phone-verification code by email. Enforces the
 * resend cooldown, invalidates any previous phone code, persists ONLY the SHA-256
 * hash and sends the raw code through the (best-effort) {@link IEmailService}.
 *
 * DB errors propagate to the caller (surfaced as 500); the actual email transport
 * is best-effort inside the email service and never throws.
 */
export class PhoneVerificationEmitter {
  private readonly ttlMinutes = env.PHONE_VERIFICATION_CODE_TTL_MIN;
  private readonly cooldownSeconds = env.PHONE_VERIFICATION_RESEND_COOLDOWN_SEC;

  constructor(
    private readonly emailService: IEmailService,
    private readonly verificationTokenRepo: IVerificationTokenRepo
  ) {}

  async requestCode(user: PhoneVerificationUser): Promise<RequestCodeResult> {
    const now = Date.now();

    const latest = await this.verificationTokenRepo.findLatestForUser(
      user.id,
      "phone_verification"
    );

    if (latest && !latest.usedAt && latest.expiresAt.getTime() > now) {
      const ageSeconds = (now - latest.createdAt.getTime()) / 1000;
      if (ageSeconds < this.cooldownSeconds) {
        return {
          sent: false,
          retryAfterSeconds: Math.ceil(this.cooldownSeconds - ageSeconds),
        };
      }
    }

    await this.verificationTokenRepo.invalidateAllForUser(user.id, "phone_verification");

    const code = generateNumericCode(6);
    const expiresAt = new Date(now + this.ttlMinutes * 60 * 1000);

    await this.verificationTokenRepo.create({
      userId: user.id,
      tokenHash: hashToken(code),
      type: "phone_verification",
      expiresAt,
    });

    await this.emailService.sendPhoneVerificationCode(user.email, {
      name: user.fullName,
      code,
      ttlMinutes: this.ttlMinutes,
    });

    return { sent: true };
  }
}
