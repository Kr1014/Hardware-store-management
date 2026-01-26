import {
    IsString,
    IsUUID,
    IsDateString,
    IsInt,
    IsNumber,
    Min,
    IsNotEmpty,
    IsArray,
    ValidateNested,
    IsOptional,
    IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuotationPriceType } from '../entities/quotation-item.entity';

export class CreateQuotationItemDto {
    @IsUUID()
    productId: string;

    @IsInt()
    @Min(1)
    quantity: number;

    @IsEnum(QuotationPriceType)
    priceType: QuotationPriceType;

    @IsNumber()
    @Min(0)
    @IsOptional()
    customPrice?: number;
}

export class CreateQuotationDto {
    @IsString()
    @IsNotEmpty()
    quotationNumber: string;

    @IsUUID()
    @IsOptional()
    clientId?: string;

    @IsDateString()
    validUntil: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateQuotationItemDto)
    items: CreateQuotationItemDto[];
}
