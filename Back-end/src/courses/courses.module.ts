// src/courses/courses.module.ts
import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { PrismaService } from '../prisma/prisma.services';

@Module({
  controllers: [CoursesController],
  providers: [PrismaService],
})
export class CoursesModule {}