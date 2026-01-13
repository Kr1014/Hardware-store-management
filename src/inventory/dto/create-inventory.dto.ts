import { Min, IsUUID, IsInt } from 'class-validator';

export class CreateInventoryDto {
    @IsInt()
    @Min(0)
    quantity: number;

    @IsUUID()
    productId: string;
}