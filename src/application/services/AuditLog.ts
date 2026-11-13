import logger from "../../main/logger";
import { AuditActorType, AuditOutcome } from "../../domain/entities/AuditEvent/auditEvent.entity";
import { hashAuditSubject } from "../utils/auditHash";
import { IAuditLogRepo } from "./IAuditLogRepo";
import { AUDIT_RETENTION_RULES, auditCutoff } from "./auditRetention";

export interface IAuditLog {
  record(
    event: string,
    subjectEmail: string | null,
    details?: Record<string, unknown>,
    outcome?: AuditOutcome,
    actorType?: AuditActorType
  ): Promise<void>;
}

const EMAIL_LIKE = /[^\s@]+@[^\s@]+\.[^\s@]+/;

/**
 * `details` is for counts and technical ids. As a last line of defence, any
 * string that looks like an e-mail is replaced, so a slip in a caller can never
 * put one in the table.
 */
function scrub(value: unknown): unknown {
  if (typeof value === "string") return EMAIL_LIKE.test(value) ? "[redacted]" : value;
  if (Array.isArray(value)) return value.map(scrub);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, scrub(v)]));
  }
  return value;
}

/**
 * Writes audit events. The e-mail is turned into a keyed hash before anything
 * is stored. Recording never throws: an audit failure must not break the
 * action being audited (it is logged instead).
 */
export class AuditLog implements IAuditLog {
  constructor(private readonly repo: IAuditLogRepo) {}

  async record(
    event: string,
    subjectEmail: string | null,
    details: Record<string, unknown> = {},
    outcome: AuditOutcome = "ok",
    actorType: AuditActorType = "user"
  ): Promise<void> {
    try {
      await this.repo.create({
        event,
        actorType,
        subjectRef: subjectEmail ? hashAuditSubject(subjectEmail) : null,
        details: scrub(details) as Record<string, unknown>,
        outcome,
      });
    } catch (error) {
      logger.error("[AuditLog.record] falha ao gravar o evento de auditoria", {
        event,
        error: (error as Error).message,
      });
    }
  }

  /** The latest event of this kind recorded for an e-mail, or `null`. */
  async latest(
    event: string,
    subjectEmail: string
  ): Promise<{ details: Record<string, unknown> } | null> {
    return this.repo.findLatest(event, hashAuditSubject(subjectEmail));
  }

  /** Deletes the events whose retention ended; returns how many were removed. */
  async purgeExpired(now: Date = new Date()): Promise<number> {
    let removed = 0;
    for (const rule of AUDIT_RETENTION_RULES) {
      removed += await this.repo.deleteOlderThan(rule.prefix, auditCutoff(now, rule.months));
    }
    return removed;
  }
}
