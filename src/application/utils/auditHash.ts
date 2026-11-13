import crypto from "crypto";
import { env } from "../../main/config/env";

/**
 * Keyed hash (HMAC-SHA-256) of an e-mail, used as the audit trail's
 * `subject_ref`. The audit table never holds the e-mail itself; to answer a
 * data subject we hash the e-mail they give us and look the hash up.
 *
 * The e-mail is normalised first (trimmed, lower-cased), so the same person
 * always gets the same reference. Key: `AUDIT_HASH_SECRET` when set, otherwise a
 * deterministic fallback derived from `JWT_SECRET` (so the boot needs no new
 * mandatory variable). Changing the key changes every reference: set the
 * variable in production to decouple it from the JWT secret.
 */
export function hashAuditSubject(email: string): string {
  const secret = env.AUDIT_HASH_SECRET ?? `audit:${env.JWT_SECRET}`;
  return crypto.createHmac("sha256", secret).update(email.trim().toLowerCase()).digest("hex");
}
