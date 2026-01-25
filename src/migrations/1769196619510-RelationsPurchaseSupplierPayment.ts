import { MigrationInterface, QueryRunner } from "typeorm";

export class RelationsPurchaseSupplierPayment1769196619510 implements MigrationInterface {
    name = 'RelationsPurchaseSupplierPayment1769196619510'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "suppliers" ADD "email" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "suppliers" DROP COLUMN "email"`);
    }

}
