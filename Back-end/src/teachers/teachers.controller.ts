import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';

@Controller('api/teachers')
export class TeachersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getAllTeachers() {
    return this.prisma.teacher.findMany({
      where: { status: 'active' },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });
  }
}