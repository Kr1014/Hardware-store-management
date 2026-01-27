import { MigrationInterface, QueryRunner } from "typeorm";

export class ModulePayments1769442877548 implements MigrationInterface {
    name = 'ModulePayments1769442877548'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "purchases" ADD "creditDays" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "purchases" ADD "dueDate" date`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD "totalAmount" numeric(12,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "purchases" DROP COLUMN "purchaseDate"`);
        await queryRunner.query(`ALTER TABLE "purchases" ADD "purchaseDate" date NOT NULL`);
        await queryRunner.query(`ALTER TABLE "purchases" DROP COLUMN "purchaseDate"`);
        await queryRunner.query(`ALTER TABLE "purchases" ADD "purchaseDate" TIMESTAMP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "purchases" DROP COLUMN "purchaseDate"`);
        await queryRunner.query(`ALTER TABLE "purchases" ADD "purchaseDate" date NOT NULL`);
        await queryRunner.query(`ALTER TABLE "purchases" DROP COLUMN "purchaseDate"`);
        await queryRunner.query(`ALTER TABLE "purchases" ADD "purchaseDate" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "totalAmount"`);
        await queryRunner.query(`ALTER TABLE "purchases" DROP COLUMN "dueDate"`);
        await queryRunner.query(`ALTER TABLE "purchases" DROP COLUMN "creditDays"`);
    }

}
