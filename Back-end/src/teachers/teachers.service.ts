// Back-end/src/teachers/teachers.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { ActivityLogService } from '../activityTimeline/activityTimeline.service';

@Injectable()
export class TeachersService {
  constructor(
    private prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
  ) {}

  // 🔹 Crear teacher con ID automático si no lo envían
  async create(dto: CreateTeacherDto) {
    // Obtener el último registrado para generar el consecutivo
    const last = await this.prisma.teacher.findFirst({
      orderBy: { id: 'desc' },
    });

    const newTeacherId = `TCH-${String((last?.id ?? 0) + 1).padStart(4, '0')}`;

    // 1) Creamos el maestro en BD
    const teacher = await this.prisma.teacher.create({
      data: {
        teacherIdNumber: dto.teacherIdNumber || newTeacherId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        hireDate: new Date(), // en BD se guarda como Date normal
      },
    });

    // 2) Preparamos datos "JSON friendly" para el log (Date -> string)
    const teacherLogData = {
      ...teacher,
      hireDate: teacher.hireDate?.toISOString(),
    };

    // 3) Auditoría
    await this.activityLog.logActivity({
      userId: null, // luego puedes pasar el id del admin que lo creó
      entityCode: 'TEACHER',
      entityId: teacher.id,
      activityCode: 'CREATE',
      description: `Teacher created: ${teacher.firstName} ${teacher.lastName} (${teacher.teacherIdNumber})`,
      oldData: null,
      newData: teacherLogData,
      isImportant: true,
    });

    return teacher;
  }

  // Obtener todos los maestros
  async findAll() {
    return this.prisma.teacher.findMany();
  }

  // Obtener uno por ID
  async findOne(id: number) {
    return this.prisma.teacher.findUnique({
      where: { id },
    });
  }

  // Actualizar
  async update(id: number, dto: any) {
    const oldTeacher = await this.prisma.teacher.findUnique({
      where: { id },
    });

    const teacher = await this.prisma.teacher.update({
      where: { id },
      data: dto,
    });

    const oldTeacherLogData = oldTeacher
      ? {
          ...oldTeacher,
          hireDate: oldTeacher.hireDate?.toISOString(),
        }
      : null;

    const teacherLogData = {
      ...teacher,
      hireDate: teacher.hireDate?.toISOString(),
    };

    await this.activityLog.logActivity({
      userId: null, // luego: admin que hizo el cambio
      entityCode: 'TEACHER',
      entityId: teacher.id,
      activityCode: 'UPDATE',
      description: `Teacher updated: ${teacher.firstName} ${teacher.lastName} (${teacher.teacherIdNumber})`,
      oldData: oldTeacherLogData,
      newData: teacherLogData,
      isImportant: true,
    });

    return teacher;
  }

  // Eliminar (compatibilidad, si tu controller usa remove)
  async remove(id: number) {
    return this.delete(id);
  }

  // Eliminar (método principal con auditoría)
  async delete(id: number) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
    });

    if (!teacher) {
      // aquí podrías lanzar NotFoundException si quieres
      return null;
    }

    await this.prisma.teacher.delete({
      where: { id },
    });

    const teacherLogData = {
      ...teacher,
      hireDate: teacher.hireDate?.toISOString(),
    };

    await this.activityLog.logActivity({
      userId: null, // luego: admin que lo eliminó
      entityCode: 'TEACHER',
      entityId: teacher.id,
      activityCode: 'DELETE',
      description: `Teacher deleted: ${teacher.firstName} ${teacher.lastName} (${teacher.teacherIdNumber})`,
      oldData: teacherLogData,
      newData: null,
      isImportant: true,
    });

    return teacher;
  }
}
