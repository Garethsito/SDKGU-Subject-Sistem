import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProgramsService {
  constructor(private prisma: PrismaService) {}

  // 🔹 Obtener todos los programas
  getAllPrograms() {
    return this.prisma.program.findMany({
      orderBy: { programName: 'asc' }
    });
  }

  // 🔹 Crear un programa
  create(data: {
    programName: string;
    programType: string;
    totalUnits: number;
    totalCourses: number;
    description?: string;
  }) {
    return this.prisma.program.create({
      data: {
        programName: data.programName,
        programType: data.programType,
        totalUnits: data.totalUnits,
        totalCourses: data.totalCourses,
         ...(data.description ? { description: data.description } : {}) // solo si viene // aquí va la descripción
      }
    });
  }

  // 🔹 Eliminar programa
  delete(id: number) {
    return this.prisma.program.delete({ where: { id } });
  }
}
