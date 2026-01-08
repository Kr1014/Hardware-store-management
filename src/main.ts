import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Configuración Global de Validación y Transformación
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Remueve campos que no estén en el DTO
      forbidNonWhitelisted: true, // Lanza error si envían campos extraños
      transform: true,            // 👈 ESTO convierte automáticamente strings a numbers/booleans según el DTO
    }),
  );

  // Habilitar CORS para que el Frontend pueda conectarse después
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();