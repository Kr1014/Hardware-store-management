import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // Creamos la instancia de la aplicación
  const app = await NestFactory.create(AppModule);

  // 1. Configuración de Validaciones Globales
  // Esto asegura que los datos que llegan al Backend coincidan con tus DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Elimina campos que no estén en el DTO
      forbidNonWhitelisted: true, // Lanza error si hay campos extra
      transform: true,            // Convierte tipos (ej: string a number) automáticamente
    }),
  );

  // 2. Configuración de CORS
  // Crucial para que tu Frontend en el puerto 3001 pueda comunicarse
  app.enableCors({
    origin: 'http://localhost:3001', // El origen permitido (tu Frontend)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,               // Permite el envío de cookies/headers de auth
  });

  // 3. Definición del Puerto
  // Lo mantenemos en el 3000 como querías
  const port = process.env.PORT ?? 3000;

  await app.listen(port);

  console.log(`\n🚀 Backend de Ferretería listo!`);
  console.log(`📡 URL: http://localhost:${port}`);
  console.log(`✨ CORS habilitado para: http://localhost:3001\n`);
}

bootstrap();