import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Purchase, PurchaseStatus } from './entities/purchase.entity';
import { PurchaseItem } from './entities/purchase-item.entity';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { SuppliersService } from '../suppliers/suppliers.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class PurchasesService {
    constructor(
        @InjectRepository(Purchase)
        private readonly purchaseRepository: Repository<Purchase>,
        @InjectRepository(PurchaseItem)
        private readonly purchaseItemRepository: Repository<PurchaseItem>,
        private readonly suppliersService: SuppliersService,
        private readonly inventoryService: InventoryService,
        private readonly dataSource: DataSource,
    ) { }

    async create(createPurchaseDto: CreatePurchaseDto) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const { items, ...purchaseData } = createPurchaseDto;

            // 1. Calculate and Prepare items
            const purchaseItems = items.map((item) => {
                const total = Number(item.quantity) * Number(item.costPrice);
                return this.purchaseItemRepository.create({
                    ...item,
                    total,
                });
            });

            const totalAmount = purchaseItems.reduce((acc, item) => acc + item.total, 0);

            // 2. Create Purchase Record
            const purchase = this.purchaseRepository.create({
                ...purchaseData,
                totalAmount,
                items: purchaseItems,
            });

            const savedPurchase = await queryRunner.manager.save(Purchase, purchase);

            // 3. Synchronize Inventory: Add stock for each item
            for (const item of items) {
                // Calling InventoryService as requested to ensure stock logic is reused
                await this.inventoryService.create({
                    productId: item.productId,
                    quantity: item.quantity,
                } as any);
            }

            // 4. Update Supplier Debt: Add total amount to debt
            await this.suppliersService.updateDebt(createPurchaseDto.supplierId, totalAmount);

            await queryRunner.commitTransaction();
            return savedPurchase;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async findAll() {
        return this.purchaseRepository.find({
            relations: ['supplier', 'items', 'items.product'],
            order: { purchaseDate: 'DESC' },
        });
    }

    async findOne(id: string) {
        const purchase = await this.purchaseRepository.findOne({
            where: { id },
            relations: ['supplier', 'items', 'items.product'],
        });
        if (!purchase) throw new NotFoundException(`Purchase with ID ${id} not found`);
        return purchase;
    }
}
