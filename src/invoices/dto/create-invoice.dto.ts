import {
    IsString, IsUUID, IsDateString, IsInt, IsNumber,
    Min, IsNotEmpty, IsArray, ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

// Clase para los items individuales
class CreateInvoiceItemDto {
    @IsUUID()
    productId: string;

    @IsString()
    @IsNotEmpty()
    productName: string;

    @IsInt()
    @Min(1)
    quantity: number;

    @IsNumber()
    @Min(0)
    unitPrice: number;
}

export class CreateInvoiceDto {
    @IsString()
    @IsNotEmpty()
    invoiceNumber: string;

    @IsUUID()
    clientId: string;

    @IsDateString()
    issueDate: string;

    @IsInt()
    creditDays: number;

    @IsNumber()
    @Min(0)
    pendingAmount: number;

    // ✅ NUEVO: Lista de productos
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateInvoiceItemDto)
    items: CreateInvoiceItemDto[];
}