import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1782669726595 implements MigrationInterface {
    name = 'Migration1782669726595'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "participants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "email" character varying NOT NULL, "is_confirmed" boolean NOT NULL DEFAULT false, "is_owner" boolean NOT NULL DEFAULT false, "avatar_url" character varying, "accent" character varying, "trip_id" uuid NOT NULL, CONSTRAINT "PK_1cda06c31eec1c95b3365a0283f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1cda06c31eec1c95b3365a0283" ON "participants" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_81b1b2a9cdcb7e0453ebbceb4e" ON "participants" ("updated_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_8b20be346d49374f1077d9840e" ON "participants" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_b77ad0832a0f8ec526c1f40a84" ON "participants" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_0cc37ab5047fa5c352ce9e095a" ON "participants" ("trip_id") `);
        await queryRunner.query(`CREATE TABLE "activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "title" character varying NOT NULL, "occurs_at" TIMESTAMP(6) NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "trip_id" uuid NOT NULL, CONSTRAINT "PK_7f4004429f731ffb9c88eb486a8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7f4004429f731ffb9c88eb486a" ON "activities" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_78166e7167f940efca662c3a65" ON "activities" ("updated_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_447bb2cdd68efb51b1ae017fa5" ON "activities" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_e5cb406a82ada9e540a17d9105" ON "activities" ("trip_id") `);
        await queryRunner.query(`CREATE TABLE "links" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "title" character varying NOT NULL, "url" character varying NOT NULL, "trip_id" uuid NOT NULL, CONSTRAINT "PK_ecf17f4a741d3c5ba0b4c5ab4b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ecf17f4a741d3c5ba0b4c5ab4b" ON "links" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_9477be4198de72c7c3aa9e582c" ON "links" ("updated_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_d556e8442468f5c811c9b9b54f" ON "links" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_14d5cf00656d69c8ea7164b38a" ON "links" ("trip_id") `);
        await queryRunner.query(`CREATE TABLE "trips" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "destination" character varying NOT NULL, "starts_at" character varying NOT NULL, "ends_at" character varying NOT NULL, "is_confirmed" boolean NOT NULL DEFAULT false, "cover_url" character varying, CONSTRAINT "PK_f71c231dee9c05a9522f9e840f5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f71c231dee9c05a9522f9e840f" ON "trips" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_71179a2e4314e4236c2cbca073" ON "trips" ("updated_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_413483638b27ddac763af43548" ON "trips" ("created_at") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "full_name" character varying NOT NULL, "phone" character varying, "email" character varying NOT NULL, "password" character varying NOT NULL, "birth_date" date, "avatar_url" character varying, "accent" character varying, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a3ffb1c0c8416b9fc6f907b743" ON "users" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_6d596d799f9cb9dac6f7bf7c23" ON "users" ("updated_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_c9b5b525a96ddc2c5647d7f7fa" ON "users" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_a000cca60bcf04454e72769949" ON "users" ("phone") `);
        await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "user_id" character varying NOT NULL, "type" character varying NOT NULL, "title" character varying NOT NULL, "body" character varying NOT NULL, "read" boolean NOT NULL DEFAULT false, "trip_id" character varying, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_6a72c3c0f683f6462415e653c3" ON "notifications" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_bc1d74459bf51659c6f4e4c429" ON "notifications" ("updated_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_77ee7b06d6f802000c0846f3a5" ON "notifications" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_9a8a82462cab47c73d25f49261" ON "notifications" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "expenses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "title" character varying NOT NULL, "amount" numeric(12,2) NOT NULL, "category" character varying NOT NULL, "paid_by_id" character varying NOT NULL, "split_between" text NOT NULL, "trip_id" uuid NOT NULL, CONSTRAINT "PK_94c3ceb17e3140abc9282c20610" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_94c3ceb17e3140abc9282c2061" ON "expenses" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_fc6ef8b1d268bbff4f05024746" ON "expenses" ("updated_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_1fcaf7c5a0233d6a51f09c9033" ON "expenses" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_bf6ee0000d1ba3f09285986e14" ON "expenses" ("trip_id") `);
        await queryRunner.query(`ALTER TABLE "participants" ADD CONSTRAINT "FK_0cc37ab5047fa5c352ce9e095a1" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activities" ADD CONSTRAINT "FK_e5cb406a82ada9e540a17d91055" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "links" ADD CONSTRAINT "FK_14d5cf00656d69c8ea7164b38a8" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expenses" ADD CONSTRAINT "FK_bf6ee0000d1ba3f09285986e14e" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT "FK_bf6ee0000d1ba3f09285986e14e"`);
        await queryRunner.query(`ALTER TABLE "links" DROP CONSTRAINT "FK_14d5cf00656d69c8ea7164b38a8"`);
        await queryRunner.query(`ALTER TABLE "activities" DROP CONSTRAINT "FK_e5cb406a82ada9e540a17d91055"`);
        await queryRunner.query(`ALTER TABLE "participants" DROP CONSTRAINT "FK_0cc37ab5047fa5c352ce9e095a1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bf6ee0000d1ba3f09285986e14"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1fcaf7c5a0233d6a51f09c9033"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fc6ef8b1d268bbff4f05024746"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_94c3ceb17e3140abc9282c2061"`);
        await queryRunner.query(`DROP TABLE "expenses"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9a8a82462cab47c73d25f49261"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_77ee7b06d6f802000c0846f3a5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bc1d74459bf51659c6f4e4c429"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6a72c3c0f683f6462415e653c3"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a000cca60bcf04454e72769949"`);
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
