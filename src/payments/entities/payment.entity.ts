import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { Purchase } from '../../purchases/entities/purchase.entity';

export enum PaymentType {
    INCOME = 'INCOME', // Ventas
    OUTCOME = 'OUTCOME' // Compras
}

@Entity('payments')
export class Payment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: PaymentType,
        default: PaymentType.INCOME
    })
    type: PaymentType;

    @Column({ nullable: true })
    invoiceId: string;

    @ManyToOne(() => Invoice, { nullable: true })
    @JoinColumn({ name: 'invoiceId' })
    invoice: Invoice;

    @Column({ nullable: true })
    purchaseId: string;

    @ManyToOne(() => Purchase, { nullable: true })
    @JoinColumn({ name: 'purchaseId' })
    purchase: Purchase;

    @Column('decimal', {
        precision: 12,
        scale: 2,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value)
        }
    })
    amount: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    paymentDate: Date;

    @CreateDateColumn()
    createdAt: Date;
}
