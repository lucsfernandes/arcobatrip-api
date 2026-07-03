import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Phase 3 "leva 2" — Item 7c (per-activity links).
 *
 * `links`:
 *  - `activity_id` (varchar, nullable) — OPTIONAL link to an activity. A trip
 *    link (existing behavior) keeps this `null`; an activity link sets it.
 *    Indexed for per-activity lookups.
 *
 * Additive and reversible.
 */
export class Migration1783203000000 implements MigrationInterface {
  name = "Migration1783203000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "links" ADD "activity_id" character varying`);
    await queryRunner.query(
      `CREATE INDEX "IDX_links_activity_id" ON "links" ("activity_id")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_links_activity_id"`);
    await queryRunner.query(`ALTER TABLE "links" DROP COLUMN "activity_id"`);
  }
}
