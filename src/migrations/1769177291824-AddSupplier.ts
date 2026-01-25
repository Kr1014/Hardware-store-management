import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSupplier1769177291824 implements MigrationInterface {
    name = 'AddSupplier1769177291824'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "suppliers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "rif" character varying NOT NULL, "contactName" character varying NOT NULL, "contactPhone" character varying, "pendingDebt" numeric(12,2) NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_f749e3870fceee8699c98a5db73" UNIQUE ("rif"), CONSTRAINT "PK_b70ac51766a9e3144f778cfe81e" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "suppliers"`);
    }

}
