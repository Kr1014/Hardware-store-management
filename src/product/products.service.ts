import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { CatalogProcessingService } from './catalog-processing.service';
import * as fs from 'fs';
import { join } from 'path';

interface CatalogImportData {
    name: string;
    price: string;
    description: string;
    originalImagePath: string;
    boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    code: string;
    category: string;
}

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        private readonly catalogProcessingService: CatalogProcessingService,
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
    async createFromImport(importData: { originalImagePath: string, products: any[], category: string }): Promise<Product[]> {
        const { originalImagePath, products, category } = importData;
        const imageBuffer = fs.readFileSync(originalImagePath);

        // 1. Llamamos a tu lógica de escaneo. 
        // Tu método cropProducts ya tiene el bucle for (let i = 0; i < finalBlocks.length; i++)
        // que guarda los archivos .jpg usando el code del producto.
        await this.catalogProcessingService.cropProducts(imageBuffer, products);

        const createdProducts: Product[] = [];

        // 2. Ahora creamos los registros en la DB
        for (const p of products) {
            const product = this.productRepository.create({
                code: p.code,
                name: p.name,
                category: category,
                purchasePrice: parseFloat(p.price) * 0.7,
                salePrice1: parseFloat(p.price),
                salePrice2: parseFloat(p.price),
                imageUrl: `http://localhost:3000/public/products/${p.code}.jpg`,
                margin: 30,
                isActive: true,
            });

            const saved = await this.productRepository.save(product);
            createdProducts.push(saved);
        }

        return createdProducts;
    }
    async processPageImport(imageBuffer: Buffer, products: any[]): Promise<Product[]> {

        // 1. Sharp procesa el buffer y genera los recortes (.jpg) en /uploads/products
        await this.catalogProcessingService.cropProducts(imageBuffer, products);

        const savedProducts: Product[] = [];

        // 2. Guardamos cada producto en PostgreSQL usando tu repositorio
        for (const p of products) {
            const product = this.productRepository.create({
                code: p.code,
                name: p.name,
                category: p.category || 'Ferreteria', // Fallback por si la IA olvida uno
                purchasePrice: parseFloat(p.purchasePrice) || 0,
                salePrice1: parseFloat(p.salePrice1) || 0,
                salePrice2: parseFloat(p.salePrice2) || 0,
                imageUrl: `http://localhost:3000/public/products/${p.code}.jpg`,
                isActive: true,
            });

            const saved = await this.productRepository.save(product);
            savedProducts.push(saved);
        }

        return savedProducts;
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
