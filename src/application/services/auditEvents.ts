/** Every audit event name. Each one needs a retention rule (see `auditRetention`). */
export const AuditEvents = {
  AccountDeletionRequested: "account.deletion_requested",
  AccountDeletionConfirmed: "account.deletion_confirmed",
  AccountDeleted: "account.deleted",
  AccountDeletionFailed: "account.deletion_failed",
  AuthLogin: "auth.login",
  AuthLoginFailed: "auth.login_failed",
  AuthPasswordChanged: "auth.password_changed",
} as const;

export type AuditEventName = (typeof AuditEvents)[keyof typeof AuditEvents];
