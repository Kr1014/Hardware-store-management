import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Supplier } from '../../suppliers/entities/supplier.entity';

export enum PaymentMethod {
    CASH = 'CASH',
    TRANSFER = 'TRANSFER',
    ZELLE = 'ZELLE',
    OTHER = 'OTHER',
}

@Entity('supplier_payments')
export class SupplierPayment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    supplierId: string;

    @ManyToOne(() => Supplier, (supplier) => supplier.payments)
    @JoinColumn({ name: 'supplierId' })
    supplier: Supplier;

    @Column('decimal', {
        precision: 12,
        scale: 2,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    amount: number;

    @Column({
        type: 'enum',
        enum: PaymentMethod,
    })
    paymentMethod: PaymentMethod;

    @Column({ nullable: true })
    reference: string;

    @Column()
    paymentDate: Date;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @CreateDateColumn()
    createdAt: Date;
}
