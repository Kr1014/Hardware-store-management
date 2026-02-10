import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from '../../product/entities/product.entity';

@Entity('cart_items')
export class CartItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    cartId: string;

    @ManyToOne(() => Cart, cart => cart.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'cartId' })
    cart: Cart;

    @Column()
    productId: string;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'productId' })
    product: Product;

    @Column('int')
    quantity: number;
}
