import { AuditActorType, AuditOutcome } from "../../domain/entities/AuditEvent/auditEvent.entity";

export interface NewAuditEvent {
  event: string;
  actorType: AuditActorType;
  subjectRef: string | null;
  details: Record<string, unknown>;
  outcome: AuditOutcome;
}

export interface IAuditLogRepo {
  create(data: NewAuditEvent): Promise<void>;
  /** Deletes the events of one family older than `cutoff`; returns how many. */
  deleteOlderThan(eventPrefix: string, cutoff: Date): Promise<number>;
}
