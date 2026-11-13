import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

export type AuditActorType = "user" | "system";
export type AuditOutcome = "ok" | "failed";

/**
 * Audit trail (LGPD art. 37): proves what was done with an account and lets us
 * answer a data subject ("was my data deleted?").
 *
 * It does NOT extend `BaseEntity`: an audit row is never updated or soft
 * deleted, only purged when its retention ends (see `auditRetention`).
 *
 * `subjectRef` is a keyed hash of the e-mail, never the e-mail itself, and
 * `details` carries only counts and technical ids — no personal data.
 */
@Entity("audit_events")
export class AuditEvent {
  @PrimaryGeneratedColumn("uuid")
  public id!: string;

  @Index()
  @CreateDateColumn({ name: "occurred_at", type: "timestamp" })
  public occurredAt!: Date;

  @Index()
  @Column({ name: "event", type: "varchar" })
  public event!: string;

  @Column({ name: "actor_type", type: "varchar" })
  public actorType!: AuditActorType;

  @Index()
  @Column({ name: "subject_ref", type: "varchar", nullable: true })
  public subjectRef!: string | null;

  @Column({ name: "details", type: "jsonb", default: () => "'{}'" })
  public details!: Record<string, unknown>;

  @Column({ name: "outcome", type: "varchar" })
  public outcome!: AuditOutcome;
}
