import { IsString, IsOptional, IsNumber, Min, IsNotEmpty, IsEnum } from 'class-validator';

export class CreateClientDto {
    @IsString()
    @IsNotEmpty()
    code: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    pendingDebt?: number;
}
