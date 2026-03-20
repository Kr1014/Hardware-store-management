import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
// 1. Nuevas importaciones necesarias para archivos estáticos
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  // 2. Le decimos a Nest que use Express explícitamente
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );


  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 3. CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS
  // Esto expone físicamente la carpeta 'uploads/products' en la URL '/public/products'
  app.useStaticAssets(join(process.cwd(), 'uploads', 'products'), {
    prefix: '/public/products/',
  });

  const port = process.env.PORT || 3000;

  await app.listen(port, '0.0.0.0');

  console.log(`\n🚀 Backend listo!`);
  console.log(`📡 URL: http://localhost:${port}`);
  console.log(`✨ CORS habilitado para: ${process.env.CORS_ORIGIN || 'http://localhost:3001'}`);
  console.log(`🖼️ Imágenes expuestas en: http://localhost:${port}/public/products/\n`);
}

bootstrap();