// Back-end/src/students/students.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async countStudents(): Promise<number> {
    const total = await this.prisma.student.count(); // 👈 Usa tu modelo Prisma (ajusta el nombre si es distinto)
    return total;
  }
    async getDistribution() {
    // Cuenta cuántos estudiantes hay por programId
    const programCounts = await this.prisma.student.groupBy({
      by: ['programId'],
      _count: { programId: true },
    });

    // Mapeo personalizado: id → nombre
    const programNames: Record<number, string> = {
      1: 'BSGM',
      2: 'ASSD',
    };

    // Convierte los datos en formato de la gráfica
    const labels = programCounts.map(p => programNames[p.programId] || `Programa ${p.programId}`);
    const data = programCounts.map(p => p._count.programId);

    return {
      studentDistribution: {
        labels,
        data,
      },
    };
  }
}
