import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
    ) { }

    async create(createProductDto: CreateProductDto, file?: Express.Multer.File, req?: any): Promise<Product> {
        let imageUrl = createProductDto.imageUrl;

        if (file) {
            const protocol = req.protocol;
            const host = req.get('host');
            imageUrl = `${protocol}://${host}/public/products/${file.filename}`;
        }

        const productData = {
            ...createProductDto,
            imageUrl,
            margin: this.calculateMargin(
                createProductDto.purchasePrice,
                createProductDto.salePrice1,
                createProductDto.salePrice2
            ),
        };

        const product = this.productRepository.create(productData);
        return this.productRepository.save(product);
    }
    async findAll() {
        return this.productRepository.find({
            where: { isActive: true },
            order: { code: 'ASC' }
        });
    }

    async getDashboardStats() {
        const [total, lowStock] = await Promise.all([
            this.productRepository.count({ where: { isActive: true } }),
            this.productRepository.count({ where: { isActive: true } }),

        ]);

        return { totalProducts: total, lowStock };
    }

    private calculateMargin(purchasePrice: number, salePrice1: number, salePrice2: number): number {
        // Toma el precio de venta MÁS BARATO
        const cheapestSalePrice = Math.min(salePrice1, salePrice2);
        return Number(((cheapestSalePrice - purchasePrice) / cheapestSalePrice * 100).toFixed(2));
    }

    async update(id: string, updateProductDto: Partial<CreateProductDto>): Promise<Product> {
        const product = await this.productRepository.findOne({ where: { id } });
        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }


        Object.assign(product, updateProductDto);

        // Recalcular margen SIEMPRE con precio más barato
        if (updateProductDto.purchasePrice || updateProductDto.salePrice1 || updateProductDto.salePrice2) {
            product.margin = this.calculateMargin(
                product.purchasePrice,
                product.salePrice1,
                product.salePrice2
            );
        }
        return this.productRepository.save(product);
    }

}
