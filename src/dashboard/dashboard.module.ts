import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { Client } from '../clients/entities/client.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Payment } from '../payments/entities/payment.entity';
import { DashboardController } from './dashboard.controller';
import { InventoryModule } from 'src/inventory/inventory.module';

@Module({
    imports: [TypeOrmModule.forFeature([Client, Invoice, Payment,]), InventoryModule],
    controllers: [DashboardController],
    providers: [DashboardService],
    exports: [DashboardService]
})
export class DashboardModule { }
