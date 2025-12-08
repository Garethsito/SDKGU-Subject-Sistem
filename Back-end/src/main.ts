// Back-end/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import helmet from 'helmet';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // HELMET - Seguridad con headers HTTP
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS - Solo dominios autorizados
  const allowedOrigins = [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:5501',
    'http://127.0.0.1:5501',
    'http://localhost:3001',
    // Agregar dominio de producción cuando lo tengas
    // 'https://tu-dominio-produccion.com'
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (como Postman o mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`❌ CORS blocked: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization, Accept',
  });

  const PORT = process.env.PORT ?? 3000;
  await app.listen(PORT);

  console.log(`✅ Prisma conectado a la base de datos`);
  console.log(`🚀 API corriendo en http://localhost:${PORT}`);
  console.log(`🔐 Endpoint login: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`📝 Endpoint register: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`🛡️ Seguridad: JWT + Bcrypt + Helmet + CORS habilitados`);
}

bootstrap();