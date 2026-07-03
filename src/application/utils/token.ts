import crypto from "crypto";

/** Generate a cryptographically-random raw token (sent only in email links). */
export function generateRawToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** SHA-256 hash of a raw token/code — only the hash is ever persisted. */
export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
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
