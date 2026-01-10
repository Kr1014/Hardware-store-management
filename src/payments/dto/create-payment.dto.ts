import { IsUUID, IsNumber, Min, IsNotEmpty } from 'class-validator';

export class CreatePaymentDto {
    @IsUUID()
    @IsNotEmpty()
    invoiceId: string;

    @IsNumber()
    @Min(0.01)
    @IsNotEmpty()
    amount: number;
}
