import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Quotation, QuotationStatus } from './entities/quotation.entity';
import { QuotationItem, QuotationPriceType } from './entities/quotation-item.entity';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { Product } from '../product/entities/product.entity';

@Injectable()
export class QuotationsService {
    constructor(
        @InjectRepository(Quotation)
        private readonly quotationRepo: Repository<Quotation>,
        @InjectRepository(QuotationItem)
        private readonly quotationItemRepo: Repository<QuotationItem>,
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
        private readonly dataSource: DataSource,
    ) { }

    async create(dto: CreateQuotationDto) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const { items: itemsDto, ...rest } = dto;

            let subtotal = 0;
            const quotationItems: QuotationItem[] = [];

            for (const itemDto of itemsDto) {
                const product = await this.productRepo.findOneBy({ id: itemDto.productId });
                if (!product) {
                    throw new NotFoundException(`Product with ID ${itemDto.productId} not found`);
                }

                let unitPrice = 0;
                if (itemDto.priceType === QuotationPriceType.PRICE_1) {
                    unitPrice = product.salePrice1;
                } else if (itemDto.priceType === QuotationPriceType.PRICE_2) {
                    unitPrice = product.salePrice2;
                } else if (itemDto.priceType === QuotationPriceType.CUSTOM) {
                    if (itemDto.customPrice === undefined) {
                        throw new BadRequestException(`Custom price is required for PRICE_TYPE CUSTOM`);
                    }
                    unitPrice = itemDto.customPrice;
                }

                const itemSubtotal = unitPrice * itemDto.quantity;
                subtotal += itemSubtotal;

                const quotationItem = this.quotationItemRepo.create({
                    productId: product.id,
                    quantity: itemDto.quantity,
                    priceType: itemDto.priceType,
                    unitPrice,
                    subtotal: itemSubtotal,
                    referenceStock: product.stock, // Informative only
                });

                quotationItems.push(quotationItem);
            }

            const taxAmount = subtotal * 0.16;
            const totalAmount = subtotal + taxAmount;

            const quotation = this.quotationRepo.create({
                ...rest,
                subtotal,
                taxAmount,
                totalAmount,
                items: quotationItems,
            });

            const savedQuotation = await queryRunner.manager.save(Quotation, quotation);
            await queryRunner.commitTransaction();

            return this.findOne(savedQuotation.id);
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    async findAll() {
        return this.quotationRepo.find({
            relations: ['client'],
            order: { quotationNumber: 'DESC' },
        });
    }

    async findOne(id: string) {
        const quotation = await this.quotationRepo.findOne({
            where: { id },
            relations: ['client', 'items', 'items.product'],
        });

        if (!quotation) {
            throw new NotFoundException(`Quotation with ID ${id} not found`);
        }

        return quotation;
    }

    async convertToInvoice(id: string) {
        const quotation = await this.findOne(id);

        if (quotation.status === QuotationStatus.INVOICED) {
            throw new BadRequestException('Quotation has already been converted to an invoice');
        }

        // Change status
        quotation.status = QuotationStatus.INVOICED;
        await this.quotationRepo.save(quotation);

        // Prepare structure for CreateInvoiceDto
        return {
            invoiceNumber: `FACT-${quotation.quotationNumber.split('-')[1]}`,
            clientId: quotation.clientId,
            issueDate: new Date().toISOString(),
            creditDays: 0, // Default for conversion
            pendingAmount: quotation.totalAmount,
            items: quotation.items.map(item => ({
                productId: item.productId,
                productName: item.product.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
            }))
        };
    }

    async updateStatus(id: string, status: QuotationStatus) {
        const quotation = await this.findOne(id);
        quotation.status = status;
        return this.quotationRepo.save(quotation);
    }
}
