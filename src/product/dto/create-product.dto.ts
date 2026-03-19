import { IsString, IsNumber, IsNotEmpty, IsPositive } from 'class-validator';

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    code: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @IsPositive()
    purchasePrice: number;

    @IsNumber()
    @IsPositive()
    salePrice1: number;

    @IsNumber()
    @IsPositive()
    salePrice2: number;

    @IsString()
    imageUrl?: string;

    @IsString()
    brand?: string;
}
