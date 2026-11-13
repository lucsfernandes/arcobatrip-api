import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Audit trail — `audit_events`.
 *
 * - `occurred_at` / `event` / `subject_ref` are indexed (purge by retention and
 *   "what happened to this person?" lookups by the hashed e-mail).
 * - `subject_ref` is a keyed hash of the e-mail, never the e-mail itself.
 * - `details` (jsonb) carries counts and technical ids only.
 *
 * Additive and reversible.
 */
export class Migration1783205000000 implements MigrationInterface {
  name = "Migration1783205000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "audit_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "occurred_at" TIMESTAMP NOT NULL DEFAULT now(), "event" character varying NOT NULL, "actor_type" character varying NOT NULL, "subject_ref" character varying, "details" jsonb NOT NULL DEFAULT '{}', "outcome" character varying NOT NULL, CONSTRAINT "PK_audit_events_id" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_events_occurred_at" ON "audit_events" ("occurred_at") `
    );
    await queryRunner.query(`CREATE INDEX "IDX_audit_events_event" ON "audit_events" ("event") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_events_subject_ref" ON "audit_events" ("subject_ref") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_events_subject_ref"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_events_event"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_events_occurred_at"`);
    await queryRunner.query(`DROP TABLE "audit_events"`);
  }
}
