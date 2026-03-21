import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
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

        // Si se sube archivo, simulamos o usamos subida a S3 
        if (file) {
            // En un entorno real, aquí invocarías el SDK de AWS o DigitalOcean
            // y obtendrías la URL de S3.
            const s3Url = process.env.S3_BUCKET_URL || 'https://tu-bucket.sfo3.digitaloceanspaces.com';
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            imageUrl = `${s3Url}/products/${uniqueSuffix}_${file.originalname}`;
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

        // 2. Ahora preparamos los registros en memoria para Bulk Insert
        const productsToInsert: any[] = [];
        for (const p of products) {
            productsToInsert.push({
                code: p.code,
                name: p.name,
                category: category,
                purchasePrice: parseFloat(p.price) * 0.7,
                salePrice1: parseFloat(p.price),
                salePrice2: parseFloat(p.price),
                imageUrl: `${process.env.S3_BUCKET_URL || 'https://tu-bucket.sfo3.digitaloceanspaces.com'}/products/${p.code}.jpg`,
                margin: 30,
                isActive: true,
            });
        }

        // 3. Bulk Insert the records via chunks
        const chunkSize = 100;
        for (let i = 0; i < productsToInsert.length; i += chunkSize) {
            const chunk = productsToInsert.slice(i, i + chunkSize);
            await this.productRepository.createQueryBuilder()
                .insert()
                .into(Product)
                .values(chunk)
                .orIgnore() // Prevents crash if product code already exists
                .execute();
        }

        return { message: `${productsToInsert.length} productos procesados correctamente.` } as any;
    }
    async processPageImport(imageBuffer: Buffer, products: any[]): Promise<Product[]> {

        // 1. Sharp procesa el buffer y genera los recortes (.jpg) en /uploads/products
        await this.catalogProcessingService.cropProducts(imageBuffer, products);

        // 2. Preparamos pre-registros
        const productsToInsert: any[] = [];
        for (const p of products) {
            productsToInsert.push({
                code: p.code,
                name: p.name,
                purchasePrice: p.purchasePrice || 0,
                salePrice1: p.salePrice1 || 0,
                salePrice2: p.salePrice2 || 0,
                imageUrl: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/products/${p.code}.jpg`,
                isActive: true,
            });
            console.log(`[DB-DEBUG] Guardando producto ${p.code} con URL: products/${p.code}.jpg`);
        }

        // 3. Bulk Insert the records via chunks of 100
        const chunkSize = 100;
        for (let i = 0; i < productsToInsert.length; i += chunkSize) {
            const chunk = productsToInsert.slice(i, i + chunkSize);
            await this.productRepository.createQueryBuilder()
                .insert()
                .into(Product)
                .values(chunk)
                .orIgnore() // Resiliencia a duplicados sin romper la carga
                .execute();
        }

        return { message: `${productsToInsert.length} productos insertados en lote` } as any;
    }
    async findAll(paginationDto?: PaginationDto) {
        const limit = paginationDto?.limit || 50;
        const offset = paginationDto?.offset || 0;

        const [data, total] = await this.productRepository.findAndCount({
            where: { isActive: true },
            order: { code: 'ASC' },
            take: limit,
            skip: offset
        });

        return {
            data,
            total,
            limit,
            offset
        };
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
