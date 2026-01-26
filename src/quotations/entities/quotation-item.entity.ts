import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Quotation } from './quotation.entity';
import { Product } from '../../product/entities/product.entity';

export enum QuotationPriceType {
    PRICE_1 = 'PRICE_1',
    PRICE_2 = 'PRICE_2',
    CUSTOM = 'CUSTOM',
}

@Entity('quotation_items')
export class QuotationItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    quotationId: string;

    @ManyToOne(() => Quotation, (quotation) => quotation.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'quotationId' })
    quotation: Quotation;

    @Column()
    productId: string;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'productId' })
    product: Product;

    @Column('int')
    quantity: number;

    @Column({
        type: 'enum',
        enum: QuotationPriceType,
    })
    priceType: QuotationPriceType;

    @Column('decimal', {
        precision: 12,
        scale: 2,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    unitPrice: number;

    @Column('decimal', {
        precision: 12,
        scale: 2,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    subtotal: number;

    @Column({ type: 'int', default: 0 })
    referenceStock: number;
}
