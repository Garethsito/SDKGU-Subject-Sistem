// src/courses/courses.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';

@Controller('api/courses')
export class CoursesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getCourses(@Query('programId') programId?: string) {
    const where = programId ? { programId: parseInt(programId) } : {};
    
    return this.prisma.course.findMany({
      where,
      orderBy: { courseCode: 'asc' },
      include: {
        program: true
      }
    });
  }
}