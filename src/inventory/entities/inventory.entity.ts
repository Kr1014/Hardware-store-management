import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from '../../product/entities/product.entity';

@Entity('inventory')
export class Inventory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    quantity: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    costPrice: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    sellPrice: number;

    @Column({ default: true })
    isActive: boolean;

    @ManyToOne(() => Product, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'productId' })
    product: Product;

    @Column()
    productId: string;
}

