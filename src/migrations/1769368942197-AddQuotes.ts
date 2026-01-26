import { MigrationInterface, QueryRunner } from "typeorm";

export class AddQuotes1769368942197 implements MigrationInterface {
    name = 'AddQuotes1769368942197'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."quotation_items_pricetype_enum" AS ENUM('PRICE_1', 'PRICE_2', 'CUSTOM')`);
        await queryRunner.query(`CREATE TABLE "quotation_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quotationId" uuid NOT NULL, "productId" uuid NOT NULL, "quantity" integer NOT NULL, "priceType" "public"."quotation_items_pricetype_enum" NOT NULL, "unitPrice" numeric(12,2) NOT NULL, "subtotal" numeric(12,2) NOT NULL, "referenceStock" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_a5ff0786836b65d12bafd0ac91e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."quotations_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'INVOICED')`);
        await queryRunner.query(`CREATE TABLE "quotations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quotationNumber" character varying NOT NULL, "clientId" uuid, "subtotal" numeric(12,2) NOT NULL DEFAULT '0', "taxAmount" numeric(12,2) NOT NULL DEFAULT '0', "totalAmount" numeric(12,2) NOT NULL DEFAULT '0', "status" "public"."quotations_status_enum" NOT NULL DEFAULT 'PENDING', "validUntil" date NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1abd99974f3059c04df9104a764" UNIQUE ("quotationNumber"), CONSTRAINT "PK_6c00eb8ba181f28c21ffba7ecb1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "quotation_items" ADD CONSTRAINT "FK_daed37b90fdb61300eabb8e2743" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quotation_items" ADD CONSTRAINT "FK_8e92de26635dda771136a35863d" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quotations" ADD CONSTRAINT "FK_f004dcdca146f7fc5428e57fb57" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "quotations" DROP CONSTRAINT "FK_f004dcdca146f7fc5428e57fb57"`);
        await queryRunner.query(`ALTER TABLE "quotation_items" DROP CONSTRAINT "FK_8e92de26635dda771136a35863d"`);
        await queryRunner.query(`ALTER TABLE "quotation_items" DROP CONSTRAINT "FK_daed37b90fdb61300eabb8e2743"`);
        await queryRunner.query(`DROP TABLE "quotations"`);
        await queryRunner.query(`DROP TYPE "public"."quotations_status_enum"`);
        await queryRunner.query(`DROP TABLE "quotation_items"`);
        await queryRunner.query(`DROP TYPE "public"."quotation_items_pricetype_enum"`);
    }

}
