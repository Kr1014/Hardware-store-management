import { MigrationInterface, QueryRunner } from "typeorm";

export class InventoryNewModifiedTable1768341402939 implements MigrationInterface {
    name = 'InventoryNewModifiedTable1768341402939'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory" ADD "costPrice" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "inventory" ADD "sellPrice" numeric(10,2) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory" DROP COLUMN "sellPrice"`);
        await queryRunner.query(`ALTER TABLE "inventory" DROP COLUMN "costPrice"`);
    }

}
