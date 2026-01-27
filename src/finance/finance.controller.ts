import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { RegisterPaymentDto } from './dto/register-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('finance')
export class FinanceController {
    constructor(private readonly financeService: FinanceService) { }

    @Get('summary')
    getDashboardSummary() {
        return this.financeService.getDashboardSummary();
    }

    @Get('documents')
    getFinancialDocuments() {
        return this.financeService.getFinancialDocuments();
    }

    @Post('payment')
    registerPayment(@Body() dto: RegisterPaymentDto) {
        return this.financeService.registerPayment(dto);
    }
}
