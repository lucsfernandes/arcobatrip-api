import crypto from "crypto";

/** Generate a cryptographically-random raw token (sent only in email links). */
export function generateRawToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** SHA-256 hash of a raw token — only the hash is ever persisted. */
export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}
