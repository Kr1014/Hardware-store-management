import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierPaymentsService } from './supplier-payments.service';
import { SupplierPaymentsController } from './supplier-payments.controller';
import { SupplierPayment } from './entities/supplier-payment.entity';
import { SuppliersModule } from '../suppliers/suppliers.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([SupplierPayment]), SuppliersModule,
        SuppliersModule,
    ],
    controllers: [SupplierPaymentsController],
    providers: [SupplierPaymentsService],
    exports: [SupplierPaymentsService],
})
export class SupplierPaymentsModule { }
