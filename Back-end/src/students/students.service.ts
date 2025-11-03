import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async countStudents(): Promise<number> {
    const total = await this.prisma.student.count(); // 👈 Usa tu modelo Prisma (ajusta el nombre si es distinto)
    return total;
  }
}
