import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Phase 2 (profile) schema additions.
 *
 * `users`:
 *  - `avatar_public_id` (varchar, nullable) — Cloudinary handle so a stored
 *    avatar can be replaced/deleted.
 *  - `bio` (text, nullable), `city` (varchar, nullable), `country`
 *    (varchar, nullable) — editable profile fields.
 *  - `phone_verified` (boolean, default false) — phone-by-email verification flag.
 *
 * `verification_tokens`:
 *  - `attempts` (int, default 0) — failed validations of a short numeric code,
 *    used to lock the phone-verification token after too many tries.
 *
 * `birth_date` and `avatar_url` already exist on `users`; the
 * `verification_tokens` table already exists — this migration is purely additive.
 */
export class Migration1783100000000 implements MigrationInterface {
  name = "Migration1783100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "avatar_public_id" character varying`);
    await queryRunner.query(`ALTER TABLE "users" ADD "bio" text`);
    await queryRunner.query(`ALTER TABLE "users" ADD "city" character varying`);
    await queryRunner.query(`ALTER TABLE "users" ADD "country" character varying`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "phone_verified" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE "verification_tokens" ADD "attempts" integer NOT NULL DEFAULT 0`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "verification_tokens" DROP COLUMN "attempts"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone_verified"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "country"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "city"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "bio"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_public_id"`);
  }
}
