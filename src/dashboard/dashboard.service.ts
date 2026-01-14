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

import { Invoice } from '../invoices/entities/invoice.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Inventory } from '../inventory/entities/inventory.entity';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Invoice)
        private invoiceRepository: Repository<Invoice>,
        @InjectRepository(Payment)
        private paymentRepository: Repository<Payment>,
        @InjectRepository(Inventory)
        private inventoryRepository: Repository<Inventory>,

    ) { }

    async getDashboardData() {
        const [financialKpis, salesTrend, stockMetrics] = await Promise.all([
            this.getFinancialKpis(),
            this.getMonthlySales(),
            this.getStockMetrics()
        ]);

        return {
            kpis: {
                pendingInvoices: financialKpis.pendingInvoices,
                overdueInvoices: financialKpis.overdueInvoices,
                pendingDebt: financialKpis.pendingDebt,
                monthlySales: financialKpis.monthlySales,
                stockValorizado: stockMetrics.stockValorizado,
                margenGanancia: `${stockMetrics.margenGanancia.toFixed(1)}%`
            },
            charts: {
                salesTrend,
            },
        };
    }

    private async getFinancialKpis() {
        const [pendingInvoices, overdueInvoices, pendingDebt, monthlySales] = await Promise.all([
            this.invoiceRepository.count({ where: { status: 'PENDING' } }),
            this.invoiceRepository.count({
                where: { status: 'PENDING', dueDate: LessThan(new Date()) },
            }),
            this.getPendingDebtAmount(),
            this.getMonthlyTotal()
        ]);

        return {
            pendingInvoices,
            overdueInvoices,
            pendingDebt,
            monthlySales
        };
    }

    private async getStockMetrics() {
        const [totalValue, avgMargin] = await Promise.all([
            this.inventoryRepository
                .createQueryBuilder('i')
                .select('SUM(i.quantity * i.sellPrice)', 'totalStockValue')
                .where('i.isActive = true')
                .getRawOne(),

            this.inventoryRepository
                .createQueryBuilder('i')
                .select('AVG(((i.sellPrice - i.costPrice) / NULLIF(i.sellPrice, 0)) * 100)', 'avgProfitMargin')
                .where('i.quantity > 0 AND i.isActive = true')
                .getRawOne()
        ]);

        return {
            stockValorizado: Number(totalValue?.totalStockValue || 0),
            margenGanancia: Number(avgMargin?.avgProfitMargin || 0)
        };
    }

    private async getPendingDebtAmount(): Promise<number> {
        const result = await this.invoiceRepository
            .createQueryBuilder('i')
            .select('SUM(i.pendingAmount)', 'totalPending')
            .where('i.status = :status', { status: 'PENDING' })
            .getRawOne();

        return Number(result?.totalPending || 0);
    }

    private async getMonthlyTotal(): Promise<number> {
        const monthStart = startOfMonth(new Date());
        const result = await this.paymentRepository
            .createQueryBuilder('p')
            .select('SUM(p.amount)', 'monthlyTotal')
            .where('p.paymentDate >= :startDate', { startDate: monthStart })
            .getRawOne();

        return Number(result?.monthlyTotal || 0);
    }

    private async getMoneyMetrics(startDate: Date) {
        const result = await this.paymentRepository
            .createQueryBuilder('p')
            .leftJoin('p.invoice', 'i')
            .select("SUM(CASE WHEN i.status = 'PENDING' THEN i.\"pendingAmount\" ELSE 0 END)", 'pendingDebt')
            .addSelect("SUM(CASE WHEN p.\"paymentDate\" >= CURRENT_DATE THEN p.amount ELSE 0 END)", 'todayPayments')
            .addSelect('SUM(p.amount)', 'monthlySales')
            .where('p.\"paymentDate\" >= :startDate', { startDate })
            .getRawOne();

        return {
            pendingDebt: result.pendingDebt,
            todayPayments: result.todayPayments,
            monthlySales: result.monthlySales,
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

        const labels: string[] = [];
        const data: number[] = [];

        for (const monthDate of monthInterval) {
            labels.push(format(monthDate, 'MMM', { locale: es }));
            const record = salesData.find((s) => isSameMonth(new Date(s.month), monthDate));
            data.push(Number(record?.total || 0));
        }

        return {
            labels,
            datasets: [
                {
                    label: 'Ventas',
                    data,
                    tension: 0.4,
                },
            ],
        };
    }
}
