// Back-end/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config(); // <-- Asegura que las variables de .env se carguen

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3001'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const PORT = process.env.PORT ?? 3000;
  await app.listen(PORT);

  console.log(`🚀 API corriendo en http://localhost:${PORT}`);
  console.log(`🔐 Endpoint login: POST http://localhost:${PORT}/api/auth/login`);
}

bootstrap();
