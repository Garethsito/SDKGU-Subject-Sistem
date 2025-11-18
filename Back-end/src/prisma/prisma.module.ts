// src/prisma/prisma.module.ts
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.services';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // ← Debe exportar
})
export class PrismaModule {}