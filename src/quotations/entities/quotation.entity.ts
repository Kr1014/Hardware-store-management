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
import { Client } from '../../clients/entities/client.entity';
import { QuotationItem } from './quotation-item.entity';

export enum QuotationStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    INVOICED = 'INVOICED',
}

@Entity('quotations')
export class Quotation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    quotationNumber: string;

    @Column({ nullable: true })
    clientId: string;

    @ManyToOne(() => Client, { nullable: true })
    @JoinColumn({ name: 'clientId' })
    client: Client;

    @Column('decimal', {
        precision: 12,
        scale: 2,
        default: 0,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    subtotal: number;

    @Column('decimal', {
        precision: 12,
        scale: 2,
        default: 0,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    taxAmount: number;

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
        enum: QuotationStatus,
        default: QuotationStatus.PENDING,
    })
    status: QuotationStatus;

    @Column({ type: 'date' })
    validUntil: Date;

    @OneToMany(() => QuotationItem, (item) => item.quotation, { cascade: true })
    items: QuotationItem[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
