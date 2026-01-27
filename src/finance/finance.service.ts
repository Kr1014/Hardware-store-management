import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { Purchase } from '../purchases/entities/purchase.entity';
import { PaymentsService } from '../payments/payments.service';
import { SupplierPaymentsService } from '../supplier-payments/supplier-payments.service';
import { FinancePaymentType, RegisterPaymentDto } from './dto/register-payment.dto';
import { PaymentMethod } from '../supplier-payments/entities/supplier-payment.entity';
import { PaymentType } from 'src/payments/entities/payment.entity';

@Injectable()
export class FinanceService {
    constructor(
        @InjectRepository(Invoice)
        private readonly invoiceRepo: Repository<Invoice>,
        @InjectRepository(Supplier)
        private readonly supplierRepo: Repository<Supplier>,
        @InjectRepository(Purchase)
        private readonly purchaseRepo: Repository<Purchase>,
        private readonly paymentsService: PaymentsService,
        private readonly supplierPaymentsService: SupplierPaymentsService,
    ) { }

    async getDashboardSummary() {
        const [invoices, suppliers] = await Promise.all([
            this.invoiceRepo.find({ where: { status: 'PENDING' } }),
            this.supplierRepo.find(),
        ]);

        const totalToCollect = invoices.reduce((sum, inv) => sum + Number(inv.pendingAmount), 0);
        const totalToPay = suppliers.reduce((sum, sup) => sum + Number(sup.pendingDebt), 0);

        return {
            totalToCollect: totalToCollect.toFixed(2),
            totalToPay: totalToPay.toFixed(2),
            netBalance: (totalToCollect - totalToPay).toFixed(2),
        };
    }

    async getFinancialDocuments() {
        const [invoices, purchases] = await Promise.all([
            this.invoiceRepo.find({ relations: ['client'] }),
            this.purchaseRepo.find({ relations: ['supplier'] }),
        ]);

        const docs = [
            ...invoices.map((inv) => ({
                id: inv.id,
                entityName: inv.client?.name || 'Público General',
                documentNumber: inv.invoiceNumber,
                issueDate: inv.issueDate,
                dueDate: inv.dueDate,
                pendingAmount: Number(inv.pendingAmount).toFixed(2),
                type: 'CXC', // Cuentas por Cobrar
                status: this.calculateStatus(inv.dueDate, inv.status),
                daysRemaining: this.calculateDaysRemaining(inv.dueDate),
            })),
            ...purchases.map((pur) => ({
                id: pur.id,
                entityName: pur.supplier?.name || 'Proveedor N/A',
                documentNumber: pur.purchaseNumber,
                issueDate: pur.purchaseDate,
                dueDate: pur.dueDate,
                pendingAmount: Number(pur.totalAmount).toFixed(2),
                type: 'CXP', // Cuentas por Pagar
                status: pur.status === 'PAID' ? 'Pagada' : this.calculateStatus(pur.dueDate, pur.status),
                daysRemaining: this.calculateDaysRemaining(pur.dueDate),
            })),
        ];

        return docs.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
    }

    private calculateStatus(dueDate: Date, currentStatus: string): string {
        if (currentStatus === 'PAID') return 'Pagada';
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        return due < now ? 'Vencida' : 'Pendiente';
    }

    private calculateDaysRemaining(dueDate: Date): number {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        const diff = due.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    async registerPayment(dto: RegisterPaymentDto) {
        // Aquí es donde ocurre la traducción:
        // COLLECTION se convierte en INCOME (Venta)
        // PAYMENT se convierte en OUTCOME (Compra)
        const mappedType = dto.type === FinancePaymentType.COLLECTION
            ? PaymentType.INCOME
            : PaymentType.OUTCOME;

        return this.paymentsService.createPayment({
            targetId: dto.targetId,
            amount: dto.amount,
            paymentDate: new Date().toISOString(), // Fecha actual por defecto
            type: mappedType, // <--- Aquí pasamos el tipo que el sistema entiende
            notes: dto.notes || `Registro vía Dashboard: ${dto.type}`
        });
    }
}
