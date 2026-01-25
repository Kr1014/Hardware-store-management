import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentsSuppliers1769191749057 implements MigrationInterface {
    name = 'AddPaymentsSuppliers1769191749057'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."supplier_payments_paymentmethod_enum" AS ENUM('CASH', 'TRANSFER', 'ZELLE', 'OTHER')`);
        await queryRunner.query(`CREATE TABLE "supplier_payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "supplierId" uuid NOT NULL, "amount" numeric(12,2) NOT NULL, "paymentMethod" "public"."supplier_payments_paymentmethod_enum" NOT NULL, "reference" character varying, "paymentDate" TIMESTAMP NOT NULL, "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_76e86f3194494faf999c652dbf9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "supplier_payments" ADD CONSTRAINT "FK_a9606c250851fd546b0669925a4" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "supplier_payments" DROP CONSTRAINT "FK_a9606c250851fd546b0669925a4"`);
        await queryRunner.query(`DROP TABLE "supplier_payments"`);
        await queryRunner.query(`DROP TYPE "public"."supplier_payments_paymentmethod_enum"`);
    }

}
