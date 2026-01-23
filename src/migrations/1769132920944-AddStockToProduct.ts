import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStockToProduct1769132920944 implements MigrationInterface {
    name = 'AddStockToProduct1769132920944'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "stock" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "stock"`);
    }

}
