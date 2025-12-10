// Back-end/src/administrators/administrators.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';
import { ActivityLogService } from '../activityTimeline/activityTimeline.service';

export interface CreateAdminDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  status?: string;
  username: string;
  password: string;
}

@Injectable()
export class AdministratorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async getAllAdmins() {
    return this.prisma.login.findMany({
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createAdmin(data: CreateAdminDto) {
    // Verificar si el username ya existe
    const existingUser = await this.prisma.login.findUnique({
      where: { username: data.username },
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Verificar si el email ya existe
    if (data.email) {
      const existingEmail = await this.prisma.login.findUnique({
        where: { email: data.email },
      });

      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    // Crear el administrador
    const admin = await this.prisma.login.create({
      data: {
        username: data.username,
        password: data.password, // ⚠️ En producción, hashear la contraseña
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        role: data.role,
        status: data.status || 'Active',
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
      },
    });

    // Registrar en activity log
    await this.activityLog.logActivity({
      userId: null,
      entityCode: 'USER',
      entityId: admin.id,
      activityCode: 'CREATE',
      description: `Administrator created: ${admin.firstName} ${admin.lastName}`,
      oldData: null,
      newData: {
        id: admin.id,
        username: admin.username,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role,
      },
      isImportant: true,
    });

    return admin;
  }

  async updateAdmin(id: number, data: Partial<CreateAdminDto>) {
    const existingAdmin = await this.prisma.login.findUnique({
      where: { id },
    });

    if (!existingAdmin) {
      throw new NotFoundException('Administrator not found');
    }

    // Si se actualiza el email, verificar que no exista
    if (data.email && data.email !== existingAdmin.email) {
      const emailExists = await this.prisma.login.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        throw new ConflictException('Email already exists');
      }
    }

    const updatedAdmin = await this.prisma.login.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        role: data.role,
        status: data.status,
        ...(data.password && { password: data.password }),
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
      },
    });

    // Registrar en activity log
    await this.activityLog.logActivity({
      userId: null,
      entityCode: 'USER',
      entityId: id,
      activityCode: 'UPDATE',
      description: `Administrator updated: ${updatedAdmin.firstName} ${updatedAdmin.lastName}`,
      oldData: {
        firstName: existingAdmin.firstName,
        lastName: existingAdmin.lastName,
        email: existingAdmin.email,
        role: existingAdmin.role,
        status: existingAdmin.status,
      },
      newData: {
        firstName: updatedAdmin.firstName,
        lastName: updatedAdmin.lastName,
        email: updatedAdmin.email,
        role: updatedAdmin.role,
        status: updatedAdmin.status,
      },
      isImportant: true,
    });

    return updatedAdmin;
  }

  async deleteAdmin(id: number) {
    const admin = await this.prisma.login.findUnique({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundException('Administrator not found');
    }

    await this.prisma.login.delete({
      where: { id },
    });

    // Registrar en activity log
    await this.activityLog.logActivity({
      userId: null,
      entityCode: 'USER',
      entityId: id,
      activityCode: 'DELETE',
      description: `Administrator deleted: ${admin.firstName} ${admin.lastName}`,
      oldData: {
        id: admin.id,
        username: admin.username,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role,
      },
      newData: null,
      isImportant: true,
    });

    return { success: true, message: 'Administrator deleted successfully' };
  }
}