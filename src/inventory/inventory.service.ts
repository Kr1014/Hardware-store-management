import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { Product } from 'src/product/entities/product.entity';

@Injectable()
export class InventoryService {
    constructor(
        @InjectRepository(Inventory)
        private inventoryRepository: Repository<Inventory>,
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
    ) { }

    async create(createInventoryDto: CreateInventoryDto): Promise<Inventory> {
        // 1. Buscamos el producto para obtener sus precios actuales
        const product = await this.productRepository.findOneBy({ id: createInventoryDto.productId });

        if (!product) throw new NotFoundException('Producto no encontrado');

        const inventory = new Inventory();
        inventory.quantity = createInventoryDto.quantity;
        inventory.productId = createInventoryDto.productId;
        inventory.isActive = true;


        inventory.costPrice = product.purchasePrice;
        inventory.sellPrice = product.salePrice1;

        return this.inventoryRepository.save(inventory);
    }


    async findAll(): Promise<Inventory[]> {
        return this.inventoryRepository
            .createQueryBuilder('i')
            .leftJoinAndSelect('i.product', 'p')
            .where('i.isActive = :active', { active: true })
            .getMany();
    }



    async getStockMetrics() {
        const [totalValue, avgMargin] = await Promise.all([
            this.inventoryRepository
                .createQueryBuilder('i')
                .select('SUM(i.quantity * i.sellPrice)', 'totalStockValue')
                .getRawOne(),

            this.inventoryRepository
                .createQueryBuilder('i')
                .select('AVG(((i.sellPrice - i.costPrice) / i.costPrice) * 100)', 'avgProfitMargin')
                .where('i.quantity > 0')
                .getRawOne()
        ]);

        return {
            stockValorizado: Number(totalValue.totalStockValue || 0),
            margenGanancia: Number(avgMargin.avgProfitMargin || 0)
        };
    }
}
