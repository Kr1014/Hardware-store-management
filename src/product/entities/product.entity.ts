import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    code: string;

    @Column()
    name: string;

    @Column()
    category: string;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    purchasePrice: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    salePrice1: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    salePrice2: number;

    @Column('decimal', { precision: 5, scale: 2, default: 0 })
    margin: number;

    @Column({ type: 'int', default: 0 })
    stock: number;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
