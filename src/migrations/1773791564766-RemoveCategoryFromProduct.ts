import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveCategoryFromProduct1773791564766 implements MigrationInterface {
    name = 'RemoveCategoryFromProduct1773791564766'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "category"`);
        await queryRunner.query(`ALTER TABLE "products" ADD "category" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "category"`);
        await queryRunner.query(`ALTER TABLE "products" ADD "category" character varying NOT NULL`);
    }

}
