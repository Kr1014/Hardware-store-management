import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SupplierPayment } from './entities/supplier-payment.entity';
import { CreateSupplierPaymentDto } from './dto/create-supplier-payment.dto';
import { SuppliersService } from '../suppliers/suppliers.service';

@Injectable()
export class SupplierPaymentsService {
    constructor(
        @InjectRepository(SupplierPayment)
        private readonly paymentRepo: Repository<SupplierPayment>,
        private readonly suppliersService: SuppliersService,
        private readonly dataSource: DataSource,
    ) { }

    async create(dto: CreateSupplierPaymentDto) {
        // 1. Validate Supplier exists
        await this.suppliersService.findOne(dto.supplierId);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 2. Create Payment Record
            const payment = this.paymentRepo.create(dto);
            const savedPayment = await queryRunner.manager.save(SupplierPayment, payment);

            // 3. Update Supplier Debt (Decrease debt)
            // We pass the amount as negative so updateDebt subtracts it.
            await this.suppliersService.updateDebt(dto.supplierId, -Number(dto.amount));

            await queryRunner.commitTransaction();
            return savedPayment;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    async findAll() {
        return this.paymentRepo.find({
            relations: ['supplier'],
            order: { paymentDate: 'DESC' },
        });
    }

    async findBySupplier(supplierId: string) {
        return this.paymentRepo.find({
            where: { supplierId },
            order: { paymentDate: 'DESC' },
        });
    }
}
