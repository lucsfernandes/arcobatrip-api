import { DataSource, Repository } from "typeorm";
import { IAuditLogRepo, NewAuditEvent } from "../../application/services/IAuditLogRepo";
import { AuditEvent } from "../../domain/entities/AuditEvent/auditEvent.entity";

export class AuditLogRepo implements IAuditLogRepo {
  private readonly repository: Repository<AuditEvent>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(AuditEvent);
  }

  async create(data: NewAuditEvent): Promise<void> {
    // `details` is a free-form jsonb object; TypeORM's deep-partial insert type
    // does not accept `Record<string, unknown>`, hence the cast.
    await this.repository.insert({
      event: data.event,
      actorType: data.actorType,
      subjectRef: data.subjectRef,
      details: data.details as never,
      outcome: data.outcome,
    });
  }

  async findLatest(
    event: string,
    subjectRef: string
  ): Promise<{ details: Record<string, unknown> } | null> {
    const row = await this.repository.findOne({
      where: { event, subjectRef },
      order: { occurredAt: "DESC" },
    });
    return row ? { details: row.details } : null;
  }

  async deleteOlderThan(eventPrefix: string, cutoff: Date): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .from(AuditEvent)
      .where("event LIKE :pattern", { pattern: `${eventPrefix}%` })
      .andWhere("occurred_at < :cutoff", { cutoff })
      .execute();
    return result.affected ?? 0;
  }
}
