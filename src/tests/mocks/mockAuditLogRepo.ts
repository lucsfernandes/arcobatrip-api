import { IAuditLogRepo, NewAuditEvent } from "../../application/services/IAuditLogRepo";

export interface StoredAuditEvent extends NewAuditEvent {
  occurredAt: Date;
}

/** In-memory {@link IAuditLogRepo}: records events and honours the retention purge. */
export class MockAuditLogRepo implements IAuditLogRepo {
  public events: StoredAuditEvent[] = [];
  /** Make `create` fail, to prove auditing never breaks the audited action. */
  public failOnCreate = false;

  async create(data: NewAuditEvent): Promise<void> {
    if (this.failOnCreate) throw new Error("database is down");
    this.events.push({ ...data, occurredAt: new Date() });
  }

  async deleteOlderThan(eventPrefix: string, cutoff: Date): Promise<number> {
    const before = this.events.length;
    this.events = this.events.filter(
      (e) => !(e.event.startsWith(eventPrefix) && e.occurredAt < cutoff)
    );
    return before - this.events.length;
  }

  /** Seed an event that happened at a given time (for retention tests). */
  seed(event: string, occurredAt: Date): void {
    this.events.push({
      event,
      actorType: "user",
      subjectRef: null,
      details: {},
      outcome: "ok",
      occurredAt,
    });
  }

  clear(): void {
    this.events = [];
    this.failOnCreate = false;
  }
}
