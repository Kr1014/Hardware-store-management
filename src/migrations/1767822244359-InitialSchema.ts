import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1767822244359 implements MigrationInterface {
    name = 'InitialSchema1767822244359'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "name" character varying NOT NULL, "category" character varying NOT NULL, "stock" integer NOT NULL DEFAULT '0', "purchasePrice" numeric(10,2) NOT NULL DEFAULT '0', "salePrice1" numeric(10,2) NOT NULL DEFAULT '0', "salePrice2" numeric(10,2) NOT NULL DEFAULT '0', "margin" numeric(5,2) NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7cfc24d6c24f0ec91294003d6b8" UNIQUE ("code"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
