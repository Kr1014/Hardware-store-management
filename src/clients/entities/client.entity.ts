import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('clients')
export class Client {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    code: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    address: string;

    @Column({ unique: true, nullable: true })
    email: string;

    @Column('decimal', {
        precision: 12,
        scale: 2,
        default: 0,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value)
        }
    })
    pendingDebt: number;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
