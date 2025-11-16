import { Module } from '@nestjs/common';
import { TeachersController } from './teachers.controller';
import { PrismaService } from '../prisma/prisma.services';

@Module({
  controllers: [TeachersController],
  providers: [PrismaService],
})
export class TeachersModule {}