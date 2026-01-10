import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../payments/entities/payment.entity';
import { InvoicesService } from '../invoices/invoices.service';
import { ClientsService } from '../clients/clients.service';

export interface CreatePaymentDto {
    invoiceId: string;
    amount: number;
}

@Injectable()
export class PaymentsService {
    constructor(
        @InjectRepository(Payment)
        private paymentRepository: Repository<Payment>,

        @Inject(forwardRef(() => InvoicesService))
        private readonly invoicesService: InvoicesService,

        @Inject(forwardRef(() => ClientsService))
        private readonly clientsService: ClientsService,
    ) { }

    async createPayment(createPaymentDto: CreatePaymentDto): Promise<Payment> {
        const { invoiceId, amount } = createPaymentDto;

        // 1. Verificar factura existe y permitir pagos si está PENDING
        const invoice = await this.invoicesService.findOne(invoiceId);

        // Mantenemos PENDING porque ya no usaremos PARTIAL en la DB
        if (invoice.status !== 'PENDING') {
            throw new BadRequestException('Only PENDING invoices can be paid');
        }

        if (amount > invoice.pendingAmount) {
            throw new BadRequestException('Payment amount exceeds invoice balance');
        }

        // 2. Crear registro del pago
        const payment = this.paymentRepository.create({
            invoiceId,
            amount: Number(amount),
            paymentDate: new Date()
        });
        const savedPayment = await this.paymentRepository.save(payment);

        // 3. Actualizar estado de la factura
        const remaining = Number(invoice.pendingAmount) - Number(amount);

        invoice.pendingAmount = remaining > 0 ? remaining : 0;

        /**
         * LÓGICA ACTUALIZADA:
         * Si el remanente es mayor a 0, se queda en 'PENDING' para evitar 
         * errores con el ENUM de la base de datos que no tiene 'PARTIAL'.
         */
        invoice.status = remaining > 0 ? 'PENDING' : 'PAID';

        await this.invoicesService.updateInvoice(invoice);

        // 4. Reducir deuda global del cliente
        await this.clientsService.updateDebt(invoice.clientId, -amount);

        return savedPayment;
    }

    async findAll() {
        return this.paymentRepository.find({
            relations: ['invoice', 'invoice.client'],
            order: { paymentDate: 'DESC' }
        });
    }

    async getPaymentsByClient(clientId: string) {
        return this.paymentRepository.find({
            // Buscamos pagos donde la factura pertenezca al cliente
            where: { invoice: { clientId } },
            relations: ['invoice', 'invoice.client'],
            order: { paymentDate: 'DESC' }
        });
    }
}