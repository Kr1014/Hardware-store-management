import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { ClientsModule } from '../clients/clients.module';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { Inventory } from 'src/inventory/entities/inventory.entity';
import { Product } from 'src/product/entities/product.entity';


@Module({
    imports: [
        TypeOrmModule.forFeature([Invoice, InvoiceItem, Inventory, Product]),
        forwardRef(() => ClientsModule)
    ],
    controllers: [InvoicesController],
    providers: [InvoicesService],
    exports: [InvoicesService]
})
export class InvoicesModule { }
