import { IsUUID, IsString, IsNotEmpty, IsNumber, IsDateString, IsArray, ValidateNested, IsEnum, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseStatus } from '../entities/purchase.entity';

class PurchaseItemDto {
    @IsUUID()
    productId: string;

    @IsNumber()
    @Min(1)
    quantity: number;

    @IsNumber()
    @Min(0)
    costPrice: number;
}

export class CreatePurchaseDto {
    @IsUUID()
    supplierId: string;

    @IsString()
    @IsNotEmpty()
    purchaseNumber: string;

    @IsDateString()
    purchaseDate: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    creditDays?: number;

    @IsEnum(PurchaseStatus)
    status: PurchaseStatus;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PurchaseItemDto)
    items: PurchaseItemDto[];
}
