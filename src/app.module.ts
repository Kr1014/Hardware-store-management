import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './product/products.module';
import { dataSourceOptions } from '../typeorm.config';
import { ClientsModule } from './clients/clients.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentsModule } from './payments/payments.module';
import { DashboardService } from './dashboard/dashboard.service';
import { DashboardModule } from './dashboard/dashboard.module';
import { InventoryModule } from './inventory/inventory.module';
import { PurchasesModule } from './purchases/purchases.module';
import { QuotationsModule } from './quotations/quotations.module';
import { SupplierPaymentsModule } from './supplier-payments/supplier-payments.module';
import { SuppliersModule } from './suppliers/suppliers.module';

@Module({
  imports: [
    // 1. Carga las variables de entorno de forma global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Configuración asíncrona de la base de datos
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...dataSourceOptions,
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        autoLoadEntities: true,
        migrationsRun: false,
      }),
    }),

    AuthModule,
    ProductsModule,
    ClientsModule,
    InvoicesModule,
    PaymentsModule,
    DashboardModule,
    InventoryModule,
    SuppliersModule,
    PurchasesModule,
    SupplierPaymentsModule,
    QuotationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule { }
