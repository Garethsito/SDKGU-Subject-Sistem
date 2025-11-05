// src/teachers/teachers.controller.ts
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';

@Controller('api/teachers')
export class TeachersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getActiveTeachers() {
    return this.prisma.teacher.findMany({
      where: { status: 'active' },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        specialization: true
      }
    });
  }
}