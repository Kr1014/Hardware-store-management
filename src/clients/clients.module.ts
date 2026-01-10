import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { Client } from './entities/client.entity';
import { Invoice } from 'src/invoices/entities/invoice.entity';
import { InvoicesModule } from 'src/invoices/invoices.module';
import { PaymentsModule } from 'src/payments/payments.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Client, Invoice]),
        forwardRef(() => InvoicesModule),  // ← FIX CIRCULAR
        forwardRef(() => PaymentsModule)   // ← FIX CIRCULAR
    ],
    controllers: [ClientsController],
    providers: [ClientsService],
    exports: [ClientsService]
})
export class ClientsModule { }

