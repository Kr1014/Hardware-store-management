import { Controller, Post, Body, Get, Param, UseGuards, UsePipes, ValidationPipe, ParseUUIDPipe } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@Controller('payments')
@Roles(UserRole.ADMIN)
@UseGuards(JwtAuthGuard)
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post()
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    create(@Body() createPaymentDto: CreatePaymentDto) {
        // Llamamos al service que ahora procesa INCOME y OUTCOME
        return this.paymentsService.createPayment(createPaymentDto);
    }

    @Get()
    findAll() {
        return this.paymentsService.findAll();
    }

    // Opcional: Podrías agregar uno para proveedores si lo necesitas
    @Get('client/:clientId')
    findByClient(@Param('clientId', ParseUUIDPipe) clientId: string) {
        return this.paymentsService.getPaymentsByClient(clientId);
    }
}