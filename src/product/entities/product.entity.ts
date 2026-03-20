import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('products')
@Index(['isActive'])
@Index(['name'])
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    @Index()
    code: string;

    @Column()
    name: string;

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

    @Column({ type: 'text', nullable: true })
    imageUrl: string;

    @Column({ nullable: true })
    brand: string;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
