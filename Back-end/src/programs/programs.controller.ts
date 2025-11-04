// src/programs/programs.controller.ts
import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';

@Controller('api/programs')
export class ProgramsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getAllPrograms() {
    return this.prisma.program.findMany({
      orderBy: { programName: 'asc' }
    });
  }

  // NUEVO: Obtener cursos de un programa
  @Get(':id/courses')
  async getProgramCourses(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.course.findMany({
      where: { programId: id },
      orderBy: { courseCode: 'asc' }
    });
  }
}