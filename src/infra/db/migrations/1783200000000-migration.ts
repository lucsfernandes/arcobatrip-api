import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Phase 3 "leva 1" — Item 10 (trip banner).
 *
 * `trips`:
 *  - `cover_public_id` (varchar, nullable) — Cloudinary handle so a stored trip
 *    banner can be replaced/deleted. Pairs with the existing `cover_url` column.
 *
 * Purely additive and reversible.
 */
export class Migration1783200000000 implements MigrationInterface {
  name = "Migration1783200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "trips" ADD "cover_public_id" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "trips" DROP COLUMN "cover_public_id"`);
  }
}
