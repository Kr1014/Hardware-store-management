import { MigrationInterface, QueryRunner } from "typeorm";

export class ModifyPayment1773436240105 implements MigrationInterface {
    name = 'ModifyPayment1773436240105'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "purchases" ADD "pendingAmount" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`CREATE TYPE "public"."payments_type_enum" AS ENUM('INCOME', 'OUTCOME')`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "type" "public"."payments_type_enum" NOT NULL DEFAULT 'INCOME'`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "purchaseId" uuid`);
        await queryRunner.query(`ALTER TABLE "purchases" DROP COLUMN "purchaseDate"`);
        await queryRunner.query(`ALTER TABLE "purchases" ADD "purchaseDate" date NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_43d19956aeab008b49e0804c145"`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "invoiceId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "invoiceId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_43d19956aeab008b49e0804c145" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_d233e4715a24816e80fb5af70b6" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_d233e4715a24816e80fb5af70b6"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_43d19956aeab008b49e0804c145"`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "invoiceId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "invoiceId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_43d19956aeab008b49e0804c145" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchases" DROP COLUMN "purchaseDate"`);
        await queryRunner.query(`ALTER TABLE "purchases" ADD "purchaseDate" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "purchaseId"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."payments_type_enum"`);
        await queryRunner.query(`ALTER TABLE "purchases" DROP COLUMN "pendingAmount"`);
    }

}
