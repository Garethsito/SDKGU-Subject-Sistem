// Back-end/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.services';
import { PrismaService } from '../prisma/prisma.services';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
  exports: [AuthService]
})
export class AuthModule {}