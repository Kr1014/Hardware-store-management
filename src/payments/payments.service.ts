import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentType } from '../payments/entities/payment.entity';
import { InvoicesService } from '../invoices/invoices.service';
import { ClientsService } from '../clients/clients.service';
import { PurchasesService } from '../purchases/purchases.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
    constructor(
        @InjectRepository(Payment)
        private paymentRepository: Repository<Payment>,

        @Inject(forwardRef(() => InvoicesService))
        private readonly invoicesService: InvoicesService,

        @Inject(forwardRef(() => ClientsService))
        private readonly clientsService: ClientsService,

        @Inject(forwardRef(() => PurchasesService))
        private readonly purchasesService: PurchasesService,

        @Inject(forwardRef(() => SuppliersService))
        private readonly suppliersService: SuppliersService,
    ) { }

    async createPayment(dto: CreatePaymentDto): Promise<Payment> {
        const { targetId, amount, paymentDate, type } = dto;

        if (type === PaymentType.INCOME) {
            // --- Lógica para Ventas (CXC) ---
            const invoice = await this.invoicesService.findOne(targetId);

            if (invoice.status === 'PAID') {
                throw new BadRequestException('Invoice is already paid');
            }

            if (amount > invoice.pendingAmount) {
                throw new BadRequestException('Payment exceeds invoice balance');
            }

            const payment = this.paymentRepository.create({
                invoiceId: targetId,
                amount: Number(amount),
                paymentDate: new Date(paymentDate),
                type: PaymentType.INCOME
            });
            const savedPayment = await this.paymentRepository.save(payment);

            const remaining = Number(invoice.pendingAmount) - Number(amount);
            invoice.pendingAmount = remaining > 0 ? remaining : 0;
            invoice.status = remaining > 0 ? 'PENDING' : 'PAID';

            await this.invoicesService.updateInvoice(invoice);
            await this.clientsService.updateDebt(invoice.clientId, -amount);

            return savedPayment;

        } else {
            // --- Lógica para Compras (CXP) ---
            const purchase = await this.purchasesService.findOne(targetId);

            if (purchase.status === 'PAID') {
                throw new BadRequestException('Purchase is already paid');
            }

            if (amount > purchase.pendingAmount) {
                throw new BadRequestException('Payment exceeds purchase balance');
            }

            const payment = this.paymentRepository.create({
                purchaseId: targetId,
                amount: Number(amount),
                paymentDate: new Date(paymentDate),
                type: PaymentType.OUTCOME
            });
            const savedPayment = await this.paymentRepository.save(payment);

            const remaining = Number(purchase.pendingAmount) - Number(amount);
            purchase.pendingAmount = remaining > 0 ? remaining : 0;
            purchase.status = remaining > 0 ? 'PENDING' : 'PAID' as any; // Cast as any if enum mismatch

            await this.purchasesService.updatePurchase(purchase);
            await this.suppliersService.updateDebt(purchase.supplierId, -amount);

            return savedPayment;
        }
    }

    async findAll() {
        return this.paymentRepository.find({
            relations: ['invoice', 'invoice.client', 'purchase', 'purchase.supplier'],
            order: { paymentDate: 'DESC' }
        });
    }

    async getPaymentsByClient(clientId: string) {
        return this.paymentRepository.find({
            where: { invoice: { clientId } },
            relations: ['invoice', 'invoice.client'],
            order: { paymentDate: 'DESC' }
        });
    }
}