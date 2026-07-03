import crypto from "crypto";
import { env } from "../../main/config/env";

/** Generate a cryptographically-random raw token (sent only in email links). */
export function generateRawToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * SHA-256 hash of a raw token/code — only the hash is ever persisted. Safe for
 * the high-entropy 32-byte email/reset tokens ({@link generateRawToken}), which
 * are not brute-forceable from the hash. NOT to be used for the short 6-digit
 * phone code — use {@link hashPhoneCode} for that.
 */
export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Keyed HMAC-SHA256 hash of the short numeric phone-verification code. A 6-digit
 * code has only 10^6 pre-images, so a plain SHA-256 digest is trivially reversible
 * from a table/DB leak. The server-side HMAC key turns the digest into a keyed MAC
 * that cannot be inverted without the secret, while preserving deterministic
 * lookup by the stored hash.
 *
 * Key resolution: `PHONE_CODE_SECRET` when set, otherwise a deterministic fallback
 * derived from `JWT_SECRET` — this keeps the boot from requiring a new mandatory
 * env while still being unguessable to an attacker who only sees the DB.
 */
export function hashPhoneCode(code: string): string {
  const secret = env.PHONE_CODE_SECRET ?? env.JWT_SECRET;
  return crypto.createHmac("sha256", secret).update(code).digest("hex");
}

/**
 * Cryptographically-uniform numeric code of `digits` length (default 6), left
 * padded with zeros. Sent only in the verification email body — only its hash is
 * persisted. Uses rejection sampling so every value is equiprobable.
 */
export function generateNumericCode(digits = 6): string {
  const max = 10 ** digits;
  const limit = Math.floor(0xffffffff / max) * max;
  let value: number;
  do {
    value = crypto.randomBytes(4).readUInt32BE(0);
  } while (value >= limit);
  return String(value % max).padStart(digits, "0");
}
