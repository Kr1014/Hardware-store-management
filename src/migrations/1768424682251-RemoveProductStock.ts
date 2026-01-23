import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveProductStock1768424682251 implements MigrationInterface {
    name = 'RemoveProductStock1768424682251'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "stock"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "stock" integer NOT NULL DEFAULT '0'`);
    }

}
