import { Controller, Post, Body, Get, Param, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards';
import { ParseUUIDPipe } from '@nestjs/common';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post()
    @UsePipes(new ValidationPipe({ transform: true }))
    create(@Body() createPaymentDto: CreatePaymentDto) {
        return this.paymentsService.createPayment(createPaymentDto);
    }

    @Get()
    findAll() {
        return this.paymentsService.findAll();
    }

    @Get('client/:clientId')
    findByClient(@Param('clientId', ParseUUIDPipe) clientId: string) {
        return this.paymentsService.getPaymentsByClient(clientId);
    }
}
