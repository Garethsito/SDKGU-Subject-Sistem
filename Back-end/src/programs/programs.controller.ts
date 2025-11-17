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

  @Get(':id/courses')
  async getProgramCourses(@Param('id', ParseIntPipe) id: number) {
    const programCourses = await this.prisma.programCourse.findMany({
      where: { programId: id },
      include: {
        course: true
      },
      orderBy: {
        course: {
          courseCode: 'asc'
        }
      }
    });

    return programCourses.map(pc => pc.course);
  }
}