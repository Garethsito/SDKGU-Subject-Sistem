import { Module } from '@nestjs/common';
import { ProgramsController } from './programs.controller';
import { ProgramsService } from './programs.service';
import { PrismaService } from '../prisma/prisma.services';

@Module({
  controllers: [ProgramsController],
  providers: [ProgramsService, PrismaService],
})
export class ProgramsModule {}
