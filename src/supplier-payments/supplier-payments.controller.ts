import { Controller, Post, Body, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { SupplierPaymentsService } from './supplier-payments.service';
import { CreateSupplierPaymentDto } from './dto/create-supplier-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@UseGuards(JwtAuthGuard)
@Controller('supplier-payments')
@Roles(UserRole.ADMIN)
export class SupplierPaymentsController {
    constructor(private readonly paymentService: SupplierPaymentsService) { }

    @Post()
    create(@Body() dto: CreateSupplierPaymentDto) {
        return this.paymentService.create(dto);
    }

    @Get()
    findAll() {
        return this.paymentService.findAll();
    }

    @Get('supplier/:supplierId')
    findBySupplier(@Param('supplierId', ParseUUIDPipe) supplierId: string) {
        return this.paymentService.findBySupplier(supplierId);
    }
}
