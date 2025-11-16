import { Module } from '@nestjs/common';
import { ProgramsController } from './programs.controller';
import { PrismaService } from '../prisma/prisma.services';

@Module({
  controllers: [ProgramsController],
  providers: [PrismaService],
})
export class ProgramsModule {}