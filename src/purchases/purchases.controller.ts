import { Controller, Get, Post, Body, Param, ParseUUIDPipe, UseGuards, Query } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('purchases')
export class PurchasesController {
    constructor(private readonly purchasesService: PurchasesService) { }

    @Post()
    create(@Body() createPurchaseDto: CreatePurchaseDto) {
        return this.purchasesService.create(createPurchaseDto);
    }

    @Get()
    findAll(@Query('status') status?: string) {
        return this.purchasesService.findAll(status);
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.purchasesService.findOne(id);
    }
}
