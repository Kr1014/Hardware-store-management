import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { CartItem } from './cart-item.entity';

@Entity('carts')
export class Cart {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @OneToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @OneToMany(() => CartItem, item => item.cart, { cascade: true })
    items: CartItem[];

    @CreateDateColumn()
    createdAt: Date;
}
