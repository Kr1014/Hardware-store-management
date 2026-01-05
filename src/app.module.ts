import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';  // ← AGREGADO
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Carga las variables de entorno de forma global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Configuración asíncrona de la base de datos
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true, // Esto creará las tablas automáticamente en desarrollo
      }),
    }),

    AuthModule,  // ← ESTA LÍNEA SOLUCIONA EL 404
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
