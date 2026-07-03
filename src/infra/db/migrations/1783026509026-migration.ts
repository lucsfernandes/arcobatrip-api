import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds `activities.created_by` (nullable) so activity edit/delete can be
 * authorized by "creator". Nullable to accommodate rows created before this
 * column existed (for those, only the trip owner may edit/delete).
 */
export class Migration1783026509026 implements MigrationInterface {
    name = 'Migration1783026509026'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activities" ADD "created_by" uuid`);
        await queryRunner.query(`CREATE INDEX "IDX_activities_created_by" ON "activities" ("created_by") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_activities_created_by"`);
        await queryRunner.query(`ALTER TABLE "activities" DROP COLUMN "created_by"`);
    }

}
