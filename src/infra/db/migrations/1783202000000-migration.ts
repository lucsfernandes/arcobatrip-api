import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Phase 3 "leva 2" — Item 7b (activity comments).
 *
 * Creates `activity_comments` (extends BaseEntity: id / created_at / updated_at /
 * deleted_at for soft delete):
 *  - `activity_id` (varchar) — the activity the comment belongs to.
 *  - `author_id` (uuid) — the authenticated user who wrote it.
 *  - `author_name` (varchar) — display-name snapshot, so the list renders without
 *    a join back to users/participants.
 *  - `body` (text) — the comment content.
 *
 * Additive and reversible.
 */
export class Migration1783202000000 implements MigrationInterface {
  name = "Migration1783202000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "activity_comments" (` +
        `"id" uuid NOT NULL DEFAULT uuid_generate_v4(), ` +
        `"updated_at" TIMESTAMP NOT NULL DEFAULT now(), ` +
        `"created_at" TIMESTAMP NOT NULL DEFAULT now(), ` +
        `"deleted_at" TIMESTAMP, ` +
        `"activity_id" character varying NOT NULL, ` +
        `"author_id" uuid NOT NULL, ` +
        `"author_name" character varying NOT NULL, ` +
        `"body" text NOT NULL, ` +
        `CONSTRAINT "PK_activity_comments" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_activity_comments_activity_id" ON "activity_comments" ("activity_id")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_activity_comments_activity_id"`);
    await queryRunner.query(`DROP TABLE "activity_comments"`);
  }
}
