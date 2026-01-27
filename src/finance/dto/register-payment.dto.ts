import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export enum FinancePaymentType {
    COLLECTION = 'COLLECTION', // Cobro a cliente
    PAYMENT = 'PAYMENT',       // Pago a proveedor
}

export class RegisterPaymentDto {
    @IsEnum(FinancePaymentType)
    type: FinancePaymentType;

    @IsUUID()
    targetId: string; // invoiceId if COLLECTION, supplierId if PAYMENT

    @IsNumber()
    @Min(0.01)
    amount: number;

    @IsString()
    @IsOptional()
    paymentMethod?: string; // CASH, TRANSFER, etc.

    @IsString()
    @IsOptional()
    reference?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}
