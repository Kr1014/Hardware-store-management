import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
    constructor(
        @InjectRepository(Supplier)
        private readonly supplierRepo: Repository<Supplier>,
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
            relations: ['purchases', 'payments', 'purchases.items', 'purchases.items.product']
        });

        if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);

        const totalPurchases = supplier.purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);
        const totalPaid = supplier.payments.reduce((sum, p) => sum + Number(p.amount), 0);

        // Calculate unique products with their last cost
        const productsMap = new Map();
        const sortedPurchases = [...supplier.purchases].sort((a, b) =>
            new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
        );

        for (const purchase of sortedPurchases) {
            for (const item of purchase.items) {
                if (item.product && !productsMap.has(item.productId)) {
                    productsMap.set(item.productId, {
                        id: item.product.id,
                        name: item.product.name,
                        sku: item.product.code,
                        lastCost: Number(item.costPrice).toFixed(2)
                    });
                }
            }
        }

        return {
            ...supplier,
            summary: {
                totalPurchases: totalPurchases.toFixed(2),
                ordersCount: supplier.purchases.length,
                totalPaid: totalPaid.toFixed(2),
                paymentsCount: supplier.payments.length,
                balance: (totalPurchases - totalPaid).toFixed(2),
            },
            history: {
                purchases: supplier.purchases.map(p => ({
                    id: p.id,
                    number: p.purchaseNumber,
                    date: p.purchaseDate,
                    amount: p.totalAmount,
                    status: p.status,
                    itemsCount: p.items.length
                })),
                payments: supplier.payments.map(p => ({
                    id: p.id,
                    date: p.paymentDate,
                    amount: p.amount,
                    method: p.paymentMethod,
                    reference: p.reference
                })),
                products: Array.from(productsMap.values())
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
