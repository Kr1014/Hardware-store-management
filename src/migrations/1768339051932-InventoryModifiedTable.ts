import { MigrationInterface, QueryRunner } from "typeorm";

export class InventoryModifiedTable1768339051932 implements MigrationInterface {
    name = 'InventoryModifiedTable1768339051932'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory" DROP CONSTRAINT "FK_c8622e1e24c6d054d36e8824490"`);
        await queryRunner.query(`ALTER TABLE "inventory" DROP COLUMN "costPrice"`);
        await queryRunner.query(`ALTER TABLE "inventory" DROP COLUMN "sellPrice"`);
        await queryRunner.query(`ALTER TABLE "inventory" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "inventory" ALTER COLUMN "quantity" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "inventory" ALTER COLUMN "quantity" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "inventory" ADD CONSTRAINT "FK_c8622e1e24c6d054d36e8824490" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory" DROP CONSTRAINT "FK_c8622e1e24c6d054d36e8824490"`);
        await queryRunner.query(`ALTER TABLE "inventory" ALTER COLUMN "quantity" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "inventory" ALTER COLUMN "quantity" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "inventory" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "inventory" ADD "sellPrice" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "inventory" ADD "costPrice" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "inventory" ADD CONSTRAINT "FK_c8622e1e24c6d054d36e8824490" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
