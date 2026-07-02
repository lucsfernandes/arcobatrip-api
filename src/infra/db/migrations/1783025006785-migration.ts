import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1783025006785 implements MigrationInterface {
    name = 'Migration1783025006785'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "email_verified_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verified_at"`);
    }

}
