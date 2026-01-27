import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
    OneToMany
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { InvoiceItem } from './invoice-item.entity';

@Entity('invoices')
export class Invoice {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    invoiceNumber: string; // FAC-2026-0001

    @Column()
    clientId: string;

    @ManyToOne(() => Client, client => client.id)
    @JoinColumn({ name: 'clientId' })
    client: Client;

    @Column('date')
    issueDate: Date; // Fecha emisión

    @Column('date')
    dueDate: Date; // Fecha vencimiento

    @Column('int')
    creditDays: number; // Plazo: 15, 30, 45 días

    @Column('decimal', {
        precision: 12,
        scale: 2,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value)
        }
    })
    totalAmount: number; // Monto total de la factura

    @Column('decimal', {
        precision: 12, scale: 2,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value)
        }
    })
    pendingAmount: number;

    @Column({
        type: 'enum',
        enum: ['PENDING', 'PAID', 'OVERDUE'],
        default: 'PENDING'
    })
    status: string;

    @CreateDateColumn()
    createdAt: Date;

    @OneToMany(() => InvoiceItem, item => item.invoice)
    items: InvoiceItem[];
}
