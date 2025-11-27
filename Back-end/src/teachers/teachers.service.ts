// Back-end/src/teachers/teachers.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';
import { CreateTeacherDto } from './dto/create-teacher.dto';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  // 🔹 Crear teacher con ID automático si no lo envían
  async create(dto: CreateTeacherDto) {
    // Obtener el último registrado para generar el consecutivo
    const last = await this.prisma.teacher.findFirst({
      orderBy: { id: 'desc' }
    });

    const newTeacherId = `TCH-${String((last?.id ?? 0) + 1).padStart(4, '0')}`;

    return this.prisma.teacher.create({
      data: {
        teacherIdNumber: dto.teacherIdNumber || newTeacherId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        hireDate: new Date(),       
      }
    });
  }

  // Obtener todos los maestros
  async findAll() {
    return this.prisma.teacher.findMany();
  }

  // Obtener uno por ID
  async findOne(id: number) {
    return this.prisma.teacher.findUnique({
      where: { id }
    });
  }

  // Actualizar
  async update(id: number, dto: any) {
    return this.prisma.teacher.update({
      where: { id },
      data: dto,
    });
  }

  // Eliminar
  async remove(id: number) {
    return this.prisma.teacher.delete({
      where: { id }
    });
  }

  async delete(id: number) {
  return this.prisma.teacher.delete({
    where: { id },
  });
}

}

