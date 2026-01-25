import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Purchase } from '../../purchases/entities/purchase.entity';
import { SupplierPayment } from '../../supplier-payments/entities/supplier-payment.entity';

@Entity('suppliers')
export class Supplier {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ unique: true })
    rif: string;

    @Column({ nullable: true })
    email: string;

    @Column()
    contactName: string;

    @Column({ nullable: true })
    contactPhone: string;

    @Column('decimal', {
        precision: 12,
        scale: 2,
        default: 0,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    pendingDebt: number;

    @Column({ default: true })
    isActive: boolean;

    @OneToMany(() => Purchase, (purchase) => purchase.supplier)
    purchases: Purchase[];

    @OneToMany(() => SupplierPayment, (payment) => payment.supplier)
    payments: SupplierPayment[];
}
