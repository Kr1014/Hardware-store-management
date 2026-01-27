import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { Purchase } from '../purchases/entities/purchase.entity';
import { PaymentsModule } from '../payments/payments.module';
import { SupplierPaymentsModule } from '../supplier-payments/supplier-payments.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Invoice, Supplier, Purchase]),
        PaymentsModule,
        SupplierPaymentsModule,
    ],
    controllers: [FinanceController],
    providers: [FinanceService],
})
export class FinanceModule { }
