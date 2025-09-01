import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1756688988199 implements MigrationInterface {
    name = 'Migration1756688988199'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "participants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "email" character varying NOT NULL, "is_confirmed" boolean NOT NULL DEFAULT false, "is_owner" boolean NOT NULL DEFAULT false, "trip_id" uuid NOT NULL, CONSTRAINT "PK_1cda06c31eec1c95b3365a0283f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1cda06c31eec1c95b3365a0283" ON "participants" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_81b1b2a9cdcb7e0453ebbceb4e" ON "participants" ("updated_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_8b20be346d49374f1077d9840e" ON "participants" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_b77ad0832a0f8ec526c1f40a84" ON "participants" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_0cc37ab5047fa5c352ce9e095a" ON "participants" ("trip_id") `);
        await queryRunner.query(`CREATE TABLE "activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "title" character varying NOT NULL, "occurs_at" TIMESTAMP(6) NOT NULL, "trip_id" uuid NOT NULL, CONSTRAINT "PK_7f4004429f731ffb9c88eb486a8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7f4004429f731ffb9c88eb486a" ON "activities" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_78166e7167f940efca662c3a65" ON "activities" ("updated_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_447bb2cdd68efb51b1ae017fa5" ON "activities" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_e5cb406a82ada9e540a17d9105" ON "activities" ("trip_id") `);
        await queryRunner.query(`CREATE TABLE "links" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "title" character varying NOT NULL, "url" character varying NOT NULL, "trip_id" uuid NOT NULL, CONSTRAINT "PK_ecf17f4a741d3c5ba0b4c5ab4b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ecf17f4a741d3c5ba0b4c5ab4b" ON "links" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_9477be4198de72c7c3aa9e582c" ON "links" ("updated_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_d556e8442468f5c811c9b9b54f" ON "links" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_14d5cf00656d69c8ea7164b38a" ON "links" ("trip_id") `);
        await queryRunner.query(`CREATE TABLE "trips" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "destination" character varying NOT NULL, "starts_at" character varying NOT NULL, "ends_at" character varying NOT NULL, "is_confirmed" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_f71c231dee9c05a9522f9e840f5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f71c231dee9c05a9522f9e840f" ON "trips" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_71179a2e4314e4236c2cbca073" ON "trips" ("updated_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_413483638b27ddac763af43548" ON "trips" ("created_at") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "username" character varying NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "phone_number" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a3ffb1c0c8416b9fc6f907b743" ON "users" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_6d596d799f9cb9dac6f7bf7c23" ON "users" ("updated_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_c9b5b525a96ddc2c5647d7f7fa" ON "users" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_17d1817f241f10a3dbafb169fd" ON "users" ("phone_number") `);
        await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`ALTER TABLE "participants" ADD CONSTRAINT "FK_0cc37ab5047fa5c352ce9e095a1" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activities" ADD CONSTRAINT "FK_e5cb406a82ada9e540a17d91055" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "links" ADD CONSTRAINT "FK_14d5cf00656d69c8ea7164b38a8" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "links" DROP CONSTRAINT "FK_14d5cf00656d69c8ea7164b38a8"`);
        await queryRunner.query(`ALTER TABLE "activities" DROP CONSTRAINT "FK_e5cb406a82ada9e540a17d91055"`);
        await queryRunner.query(`ALTER TABLE "participants" DROP CONSTRAINT "FK_0cc37ab5047fa5c352ce9e095a1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_17d1817f241f10a3dbafb169fd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c9b5b525a96ddc2c5647d7f7fa"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6d596d799f9cb9dac6f7bf7c23"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a3ffb1c0c8416b9fc6f907b743"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_413483638b27ddac763af43548"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_71179a2e4314e4236c2cbca073"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f71c231dee9c05a9522f9e840f"`);
        await queryRunner.query(`DROP TABLE "trips"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_14d5cf00656d69c8ea7164b38a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d556e8442468f5c811c9b9b54f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9477be4198de72c7c3aa9e582c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ecf17f4a741d3c5ba0b4c5ab4b"`);
        await queryRunner.query(`DROP TABLE "links"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e5cb406a82ada9e540a17d9105"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_447bb2cdd68efb51b1ae017fa5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_78166e7167f940efca662c3a65"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7f4004429f731ffb9c88eb486a"`);
        await queryRunner.query(`DROP TABLE "activities"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0cc37ab5047fa5c352ce9e095a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b77ad0832a0f8ec526c1f40a84"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8b20be346d49374f1077d9840e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_81b1b2a9cdcb7e0453ebbceb4e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1cda06c31eec1c95b3365a0283"`);
        await queryRunner.query(`DROP TABLE "participants"`);
    }

}
