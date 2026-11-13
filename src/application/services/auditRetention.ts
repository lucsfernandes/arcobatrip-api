import { AuditEvents } from "./auditEvents";

/** How long each family of audit events is kept (D5 and D6 of the account-deletion plan). */
export const AUDIT_RETENTION_RULES = [
  // Proof that an account was deleted: 5 years (the CDC's general limitation period).
  { prefix: "account.", months: 60 },
  // Login, failed login and password change: 6 months.
  { prefix: "auth.", months: 6 },
] as const;

/** Months an event is kept, or `null` when no rule covers it. */
export function auditRetentionMonths(event: string): number | null {
  return AUDIT_RETENTION_RULES.find((r) => event.startsWith(r.prefix))?.months ?? null;
}

/** The instant before which events of a rule are expired. */
export function auditCutoff(now: Date, months: number): Date {
  const cutoff = new Date(now.getTime());
  cutoff.setUTCMonth(cutoff.getUTCMonth() - months);
  return cutoff;
}

/** Guard for the tests: every defined event must be covered by a retention rule. */
export function allAuditEventsHaveRetention(): boolean {
  return Object.values(AuditEvents).every((event) => auditRetentionMonths(event) !== null);
}
