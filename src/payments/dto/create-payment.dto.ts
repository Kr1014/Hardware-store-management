import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, IsDateString, Min } from 'class-validator';

export enum PaymentType {
    INCOME = 'INCOME',   // Para Facturas de Venta (Invoices)
    OUTCOME = 'OUTCOME', // Para Facturas de Compra (Purchases)
}

export class CreatePaymentDto {
    @IsEnum(PaymentType)
    type: PaymentType;

    @IsUUID()
    targetId: string; // Puede ser invoiceId o purchaseId

    @IsNumber()
    @Min(0.01)
    amount: number;

    @IsDateString()
    paymentDate: string; // La fecha que solicitaste agregar

    @IsString()
    @IsOptional()
    notes?: string;
}