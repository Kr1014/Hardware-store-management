import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    code: string; // Código (TOR001)

    @Column()
    name: string; // Nombre completo

    @Column()
    category: string; // Categoría (Tornillos, Pinturas, etc)

    @Column('int', { default: 0 })
    stock: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    purchasePrice: number; // Precio de compra

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    salePrice1: number; // Precio Venta 1

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    salePrice2: number; // Precio Venta 2

    @Column('decimal', { precision: 5, scale: 2, default: 0 })
    margin: number; // Margen % (calculado: (venta1-compra)/venta1 * 100)

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
