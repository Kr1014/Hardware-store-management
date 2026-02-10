import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { APP_GUARD } from '@nestjs/core'; // <--- IMPORTANTE

// Importa tus Guards y Decoradores
import { RolesGuard } from './auth/guards/roles.guard';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './product/products.module';
import { dataSourceOptions } from '../typeorm.config';
import { ClientsModule } from './clients/clients.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentsModule } from './payments/payments.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { InventoryModule } from './inventory/inventory.module';
import { FinanceModule } from './finance/finance.module';
import { PurchasesModule } from './purchases/purchases.module';
import { QuotationsModule } from './quotations/quotations.module';
import { SupplierPaymentsModule } from './supplier-payments/supplier-payments.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { CartModule } from './cart/cart.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/public',
    }),

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
    FinanceModule,
    SuppliersModule,
    PurchasesModule,
    SupplierPaymentsModule,
    QuotationsModule,
    CartModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 1. Activa la protección JWT en toda la aplicación por defecto
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 2. Activa el validador de Roles en toda la aplicación
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule { }