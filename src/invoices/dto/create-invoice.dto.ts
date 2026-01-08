import { IsString, IsUUID, IsDateString, IsInt, IsNumber, Min, IsNotEmpty } from 'class-validator';

export class CreateInvoiceDto {
    @IsString()
    @IsNotEmpty()
    invoiceNumber: string;

    @IsUUID()
    clientId: string;

    // ✅ CAMBIO: IsDateString() ← ACEPTA string ISO
    @IsDateString()
    issueDate: string;

    @IsInt()
    creditDays: number;

    @IsNumber()
    @Min(0)
    pendingAmount: number;
}
