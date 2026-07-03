import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Phase 3 "leva 1" — Item 7a (rich activity fields + expense-by-activity).
 *
 * `activities`:
 *  - `description` (text, nullable) — free-form activity description.
 *  - `banner_url` (varchar, nullable) — Cloudinary delivery URL for the banner.
 *  - `banner_public_id` (varchar, nullable) — Cloudinary handle for replace/delete.
 *
 * `expenses`:
 *  - `activity_id` (varchar, nullable) — OPTIONAL tag linking an expense to an
 *    activity of the same trip. Does NOT change the trip-wide settlement
 *    aggregation (activity expenses still count in the trip total). Indexed for
 *    future per-activity lookups.
 *
 * Purely additive and reversible.
 */
export class Migration1783201000000 implements MigrationInterface {
  name = "Migration1783201000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "activities" ADD "description" text`);
    await queryRunner.query(`ALTER TABLE "activities" ADD "banner_url" character varying`);
    await queryRunner.query(`ALTER TABLE "activities" ADD "banner_public_id" character varying`);
    await queryRunner.query(`ALTER TABLE "expenses" ADD "activity_id" character varying`);
    await queryRunner.query(
      `CREATE INDEX "IDX_expenses_activity_id" ON "expenses" ("activity_id")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_expenses_activity_id"`);
    await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "activity_id"`);
    await queryRunner.query(`ALTER TABLE "activities" DROP COLUMN "banner_public_id"`);
    await queryRunner.query(`ALTER TABLE "activities" DROP COLUMN "banner_url"`);
    await queryRunner.query(`ALTER TABLE "activities" DROP COLUMN "description"`);
  }
}
