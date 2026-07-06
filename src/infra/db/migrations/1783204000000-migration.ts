import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * "Acerto de contas" — persist recorded settlement payments (settledPayments).
 *
 * `settled_payments`:
 *  - BaseEntity columns (uuid id, created_at, updated_at, deleted_at soft
 *    delete).
 *  - `trip_id` (uuid) — the trip the payment belongs to. Indexed; FK to
 *    `trips` with ON DELETE CASCADE (mirrors `expenses`).
 *  - `from_id` / `to_id` (varchar) — participant ids of payer/receiver.
 *  - `amount` numeric(12,2) — same precision/scale as `expenses.amount`.
 *
 * Additive and reversible.
 */
export class Migration1783204000000 implements MigrationInterface {
  name = "Migration1783204000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "settled_payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "trip_id" uuid NOT NULL, "from_id" character varying NOT NULL, "to_id" character varying NOT NULL, "amount" numeric(12,2) NOT NULL, CONSTRAINT "PK_settled_payments_id" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_settled_payments_id" ON "settled_payments" ("id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_settled_payments_updated_at" ON "settled_payments" ("updated_at") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_settled_payments_created_at" ON "settled_payments" ("created_at") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_settled_payments_trip_id" ON "settled_payments" ("trip_id") `
    );
    await queryRunner.query(
      `ALTER TABLE "settled_payments" ADD CONSTRAINT "FK_settled_payments_trip_id" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "settled_payments" DROP CONSTRAINT "FK_settled_payments_trip_id"`
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_settled_payments_trip_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_settled_payments_created_at"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_settled_payments_updated_at"`
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_settled_payments_id"`);
    await queryRunner.query(`DROP TABLE "settled_payments"`);
  }
}
