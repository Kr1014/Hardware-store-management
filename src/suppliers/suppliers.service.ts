import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SupplierPayment } from '../supplier-payments/entities/supplier-payment.entity';
import { Payment } from '../payments/entities/payment.entity';
import { PurchaseItem } from '../purchases/entities/purchase-item.entity';

@Injectable()
export class SuppliersService {
    constructor(
        @InjectRepository(Supplier)
        private readonly supplierRepo: Repository<Supplier>,
        private readonly dataSource: DataSource,
    ) { }

    async create(dto: CreateSupplierDto): Promise<Supplier> {
        const supplier = this.supplierRepo.create(dto);
        return this.supplierRepo.save(supplier);
    }

    async findAll(isActive?: boolean): Promise<Supplier[]> {
        const where = isActive !== undefined ? { isActive } : {};
        return this.supplierRepo.find({ where, order: { name: 'ASC' } });
    }

    async findOne(id: string) {
        const supplier = await this.supplierRepo.findOne({
            where: { id },
            relations: ['purchases']
        });

        if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);

        const purchaseIds = supplier.purchases.map(p => p.id);

        // 1. Accurate Payment History (Unified + Legacy)
        const oldPayments = await this.dataSource.getRepository(SupplierPayment).find({
            where: { supplierId: id },
            order: { paymentDate: 'DESC' }
        });

        let unifiedPayments: Payment[] = [];
        if (purchaseIds.length > 0) {
            unifiedPayments = await this.dataSource.getRepository(Payment).find({
                where: { purchaseId: In(purchaseIds) },
                relations: ['purchase'],
                order: { paymentDate: 'DESC' }
            });
        }

        const historyPayments = [
            ...oldPayments.map(p => ({
                id: p.id,
                date: p.paymentDate,
                amount: p.amount,
                method: p.paymentMethod,
                reference: p.reference,
                type: 'LEGACY'
            })),
            ...unifiedPayments.map(p => ({
                id: p.id,
                date: p.paymentDate,
                amount: p.amount,
                method: 'UNIFIED', // Could add more details if needed
                reference: p.purchase?.purchaseNumber,
                type: 'UNIFIED'
            }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // 2. Calculate paid amount per purchase for the summary view
        const paidPerPurchase = new Map<string, number>();
        unifiedPayments.forEach(p => {
            if (p.purchaseId) {
                const current = paidPerPurchase.get(p.purchaseId) || 0;
                paidPerPurchase.set(p.purchaseId, current + Number(p.amount));
            }
        });

        // 3. Efficient Unique Products History
        let suppliedProducts: any[] = [];
        if (purchaseIds.length > 0) {
            const rawItems = await this.dataSource.getRepository(PurchaseItem).find({
                where: { purchaseId: In(purchaseIds) },
                relations: ['product', 'purchase'],
                order: { purchase: { purchaseDate: 'DESC' } }
            });

            const productsMap = new Map();
            for (const item of rawItems) {
                if (item.product && !productsMap.has(item.productId)) {
                    productsMap.set(item.productId, {
                        id: item.product.id,
                        name: item.product.name,
                        sku: item.product.code,
                        lastCost: Number(item.costPrice).toFixed(2)
                    });
                }
            }
            suppliedProducts = Array.from(productsMap.values());
        }

        // 3. Totals Calculation
        const totalPurchases = supplier.purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);
        const totalPaid = historyPayments.reduce((sum, p) => sum + Number(p.amount), 0);

        // 4. Simplify Response (Extracting only what's needed)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { purchases, payments, ...cleanSupplier } = supplier as any;

        return {
            ...cleanSupplier,
            summary: {
                totalPurchases: totalPurchases.toFixed(2),
                ordersCount: supplier.purchases.length,
                totalPaid: totalPaid.toFixed(2),
                paymentsCount: historyPayments.length,
                balance: Number(supplier.pendingDebt).toFixed(2),
            },
            history: {
                purchases: supplier.purchases.map(p => ({
                    id: p.id,
                    number: p.purchaseNumber,
                    date: p.purchaseDate,
                    amount: p.totalAmount,
                    paidAmount: Number(paidPerPurchase.get(p.id) || 0).toFixed(2),
                    status: p.status,
                })),
                payments: historyPayments,
                products: suppliedProducts
            }
        };
    }

    async update(id: string, dto: UpdateSupplierDto): Promise<Supplier> {
        const supplier = await this.findOne(id);
        Object.assign(supplier, dto);
        return this.supplierRepo.save(supplier);
    }

    async remove(id: string): Promise<void> {
        const supplier = await this.findOne(id);
        await this.supplierRepo.remove(supplier);
    }

    /** Adjust pendingDebt by amount (positive or negative) */
    async updateDebt(id: string, amount: number): Promise<Supplier> {
        const supplier = await this.findOne(id);
        supplier.pendingDebt = Number(supplier.pendingDebt) + Number(amount);
        return this.supplierRepo.save(supplier);
    }
}
