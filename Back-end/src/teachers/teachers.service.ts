import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  // 🔹 Obtener todos los teachers
  async findAll() {
    return this.prisma.teacher.findMany();
  }

  // 🔹 Crear teacher
  async create(dto: CreateTeacherDto) {
    return this.prisma.teacher.create({
      data: dto,
    });
  }

  // 🔹 Eliminar teacher por id
  async delete(id: number) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return this.prisma.teacher.delete({
      where: { id },
    });
  }
}
