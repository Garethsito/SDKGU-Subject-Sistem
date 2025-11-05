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
  async countSessions(){
    return await this.prisma.session.count();
  }

  // Obtener todas las sesiones reales de la base de datos
  async getAllSessions() {
    const sessions = await this.prisma.session.findMany({
      include: {
        program: { select: { programName: true } }, // 👈 obtiene el nombre del programa
      },
      orderBy: { startDate: 'asc' },
    });

    // 🔄 Transformar los datos al formato esperado por el frontend
    return sessions.map(s => ({
      id: s.id,
      name: s.sessionName,
      program: s.program?.programName || 'N/A',
      month: s.startDate.toLocaleString('default', { month: 'long' }),
      occupancy: Math.floor(Math.random() * 100), // si no tienes campo real, puedes quitarlo luego
      status: new Date(s.endDate) > new Date() ? 'active' : 'ended',
      lowEnrollment: false, // por ahora fijo (puedes calcularlo luego)
      subjects: [], // puedes relacionarlo con offerings si quieres
      professor: 'N/A', // si no hay relación, puedes dejarlo vacío
    }));
  }
}
