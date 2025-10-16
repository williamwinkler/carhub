import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1760640865984 implements MigrationInterface {
    name = 'InitialSchema1760640865984'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "car_manufacturers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_8c0268ea18bf35bc26435d7821a" UNIQUE ("name"), CONSTRAINT "UQ_eee90e28243813d6aa303d07d22" UNIQUE ("slug"), CONSTRAINT "PK_b031d4643c5dfba35175fd3f9a1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "car_models" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "manufacturerId" uuid NOT NULL, CONSTRAINT "UQ_fbd1104c4ba4da277de745e5e1e" UNIQUE ("name"), CONSTRAINT "UQ_706ecf93f8997a248e77dbbe7cf" UNIQUE ("slug"), CONSTRAINT "PK_ee4355345e0e1c18cb6efa2bd5c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cars" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "year" integer NOT NULL, "color" character varying NOT NULL, "kmDriven" integer NOT NULL, "price" integer NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "modelId" uuid NOT NULL, "createdById" uuid NOT NULL, CONSTRAINT "PK_fc218aa84e79b477d55322271b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'user')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" "public"."users_role_enum" NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "username" character varying NOT NULL, "password" character varying NOT NULL, "apiKeyLookupHash" text, "apiKeySecret" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_bd7b453958074c31a7776003aa7" UNIQUE ("apiKeyLookupHash"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_favorite_cars" ("user_id" uuid NOT NULL, "car_id" uuid NOT NULL, CONSTRAINT "PK_6c8cab120eb3ecfae3e31f51d78" PRIMARY KEY ("user_id", "car_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_43286e6d2439f9d1a0274de56f" ON "user_favorite_cars" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_171546970a67280f6753b1f308" ON "user_favorite_cars" ("car_id") `);
        await queryRunner.query(`ALTER TABLE "car_models" ADD CONSTRAINT "FK_0e45b46abb6bdf1cf3ee797a379" FOREIGN KEY ("manufacturerId") REFERENCES "car_manufacturers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cars" ADD CONSTRAINT "FK_415edcdb4b9eaeb5dd6ee266590" FOREIGN KEY ("modelId") REFERENCES "car_models"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cars" ADD CONSTRAINT "FK_4ddbf9f4089f5e6863e9e7dc986" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_favorite_cars" ADD CONSTRAINT "FK_43286e6d2439f9d1a0274de56fb" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_favorite_cars" ADD CONSTRAINT "FK_171546970a67280f6753b1f308c" FOREIGN KEY ("car_id") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_favorite_cars" DROP CONSTRAINT "FK_171546970a67280f6753b1f308c"`);
        await queryRunner.query(`ALTER TABLE "user_favorite_cars" DROP CONSTRAINT "FK_43286e6d2439f9d1a0274de56fb"`);
        await queryRunner.query(`ALTER TABLE "cars" DROP CONSTRAINT "FK_4ddbf9f4089f5e6863e9e7dc986"`);
        await queryRunner.query(`ALTER TABLE "cars" DROP CONSTRAINT "FK_415edcdb4b9eaeb5dd6ee266590"`);
        await queryRunner.query(`ALTER TABLE "car_models" DROP CONSTRAINT "FK_0e45b46abb6bdf1cf3ee797a379"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_171546970a67280f6753b1f308"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_43286e6d2439f9d1a0274de56f"`);
        await queryRunner.query(`DROP TABLE "user_favorite_cars"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "cars"`);
        await queryRunner.query(`DROP TABLE "car_models"`);
        await queryRunner.query(`DROP TABLE "car_manufacturers"`);
    }

}
