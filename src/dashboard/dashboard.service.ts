import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
    startOfMonth,
    subMonths,
    format,
    eachMonthOfInterval,
    isSameMonth
} from 'date-fns';
import { es } from 'date-fns/locale';

// Entidades (Asegúrate de que las rutas sean correctas en tu proyecto)
import { Client } from '../clients/entities/client.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Payment } from '../payments/entities/payment.entity';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Client)
        private clientRepository: Repository<Client>,
        @InjectRepository(Invoice)
        private invoiceRepository: Repository<Invoice>,
        @InjectRepository(Payment)
        private paymentRepository: Repository<Payment>,
    ) { }

    /**
     * Helper para formatear moneda
     */
    private formatMoney(value: any): string {
        return Number(value || 0).toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    async getDashboardData() {
        // Usamos la función correcta de date-fns: startOfMonth
        const monthStart = startOfMonth(new Date());

        // Ejecutamos todo en paralelo para máxima velocidad
        const [totalClients, pendingInvoices, overdueInvoices, moneyMetrics, salesTrend] = await Promise.all([
            this.clientRepository.count({ where: { isActive: true } }),
            this.invoiceRepository.count({ where: { status: 'PENDING' } }),
            this.invoiceRepository.count({
                where: { status: 'PENDING', dueDate: LessThan(new Date()) },
            }),
            this.getMoneyMetrics(monthStart),
            this.getMonthlySales(),
        ]);

        return {
            kpis: {
                totalClients,
                pendingInvoices,
                overdueInvoices,
                ...moneyMetrics,
            },
            charts: {
                salesTrend,
            },
        };
    }

    private async getMoneyMetrics(startDate: Date) {
        const result = await this.paymentRepository
            .createQueryBuilder('p')
            .leftJoin('p.invoice', 'i')
            // CAMBIA i.pending_amount POR i.pendingAmount
            .select("SUM(CASE WHEN i.status = 'PENDING' THEN i.\"pendingAmount\" ELSE 0 END)", 'pendingDebt')
            .addSelect("SUM(CASE WHEN p.\"paymentDate\" >= CURRENT_DATE THEN p.amount ELSE 0 END)", 'todayPayments')
            .addSelect('SUM(p.amount)', 'monthlySales')
            .where('p.\"paymentDate\" >= :startDate', { startDate })
            .getRawOne();

        return {
            // Usamos this.formatMoney para resolver el error de "Cannot find name"
            pendingDebt: this.formatMoney(result.pendingDebt),
            todayPayments: this.formatMoney(result.todayPayments),
            monthlySales: this.formatMoney(result.monthlySales),
        };
    }

    private async getMonthlySales() {
        const endDate = new Date();
        const startDate = subMonths(startOfMonth(endDate), 5);

        const salesData = await this.paymentRepository
            .createQueryBuilder('p')
            .select("DATE_TRUNC('month', p.paymentDate)", 'month')
            .addSelect('SUM(p.amount)', 'total')
            .where('p.paymentDate BETWEEN :startDate AND :endDate', { startDate, endDate })
            .groupBy("DATE_TRUNC('month', p.paymentDate)")
            .orderBy('month', 'ASC')
            .getRawMany();

        const monthInterval = eachMonthOfInterval({ start: startDate, end: endDate });

        // ✅ Corregimos el error de tipo 'never' inicializando los arrays con tipos
        const labels: string[] = [];
        const data: number[] = [];

        for (const monthDate of monthInterval) {
            // Nombre del mes
            labels.push(format(monthDate, 'MMM', { locale: es }));

            // Buscar datos
            const record = salesData.find((s) => isSameMonth(new Date(s.month), monthDate));
            data.push(Number(record?.total || 0));
        }

        return {
            labels,
            datasets: [
                {
                    label: 'Ventas',
                    data,
                    borderColor: '#00D4AA',
                    backgroundColor: 'rgba(0, 212, 170, 0.2)',
                    tension: 0.4,
                },
            ],
        };
    }
}