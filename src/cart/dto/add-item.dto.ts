import { IsString, IsInt, IsPositive, IsNotEmpty } from 'class-validator';

export class AddItemDto {
    @IsString()
    @IsNotEmpty()
    productId: string;

    @IsInt()
    @IsPositive()
    quantity: number;
}
