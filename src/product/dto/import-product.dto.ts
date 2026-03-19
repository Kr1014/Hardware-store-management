import { Type } from 'class-transformer';
import { IsString, IsNumber, IsOptional, Min, IsNotEmpty } from 'class-validator';

export class N8nProductDto {
    @IsString()
    @IsNotEmpty()
    code: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    category?: string = 'Ferreteria';

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    purchasePrice?: number = 0;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    salePrice1?: number = 0;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    salePrice2?: number = 0;
}
