import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveCreditRating1767888266081 implements MigrationInterface {
    name = 'RemoveCreditRating1767888266081'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "clients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "name" character varying NOT NULL, "phone" character varying, "address" character varying, "pendingDebt" numeric(12,2) NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_5b84bb456aa7fc9241c5d8277d0" UNIQUE ("code"), CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "clients"`);
    }

}
