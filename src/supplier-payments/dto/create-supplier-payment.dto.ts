import { IsUUID, IsNumber, IsEnum, IsString, IsOptional, IsDateString, Min } from 'class-validator';
import { PaymentMethod } from '../entities/supplier-payment.entity';

export class CreateSupplierPaymentDto {
    @IsUUID()
    supplierId: string;

    @IsNumber()
    @Min(0.01)
    amount: number;

    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    @IsString()
    @IsOptional()
    reference?: string;

    @IsDateString()
    paymentDate: string;

    @IsString()
    @IsOptional()
    notes?: string;
}
