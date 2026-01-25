import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { PurchaseItem } from './purchase-item.entity';

export enum PurchaseStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
}

@Entity('purchases')
export class Purchase {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    supplierId: string;

    @ManyToOne(() => Supplier, (supplier) => supplier.purchases)
    @JoinColumn({ name: 'supplierId' })
    supplier: Supplier;

    @Column({ unique: true })
    purchaseNumber: string;

    @Column('decimal', {
        precision: 12,
        scale: 2,
        default: 0,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    totalAmount: number;

    @Column({
        type: 'enum',
        enum: PurchaseStatus,
        default: PurchaseStatus.PENDING,
    })
    status: PurchaseStatus;

    @Column()
    purchaseDate: Date;

    @OneToMany(() => PurchaseItem, (item) => item.purchase, { cascade: true })
    items: PurchaseItem[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
