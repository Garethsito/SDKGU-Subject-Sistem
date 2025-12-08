
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';
import { Prisma } from '@prisma/client';


export interface LogActivityParams {
  userId?: number | null;
  entityCode: string;      // 'STUDENT', 'SESSION', 'COURSE_OFFERING', etc.
  entityId?: number | null;
  activityCode: string;    // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', etc.
  description?: string | null;
  oldData?: Prisma.JsonValue | null;
  newData?: Prisma.JsonValue | null;
  isImportant?: boolean;
}

@Injectable()
export class ActivityLogService {
  constructor(private readonly prisma: PrismaService) { }

  async logActivity(params: LogActivityParams): Promise<void> {
    const {
      userId = null,
      entityCode,
      entityId = null,
      activityCode,
      description = null,
      oldData = null,
      newData = null,
      isImportant = false,
    } = params;

    try {
      // VALIDAR QUE EXISTAN LOS TIPOS ANTES DE CREAR
      const entityType = await this.prisma.entityType.findUnique({
        where: { code: entityCode }
      });

      const activityType = await this.prisma.activityType.findUnique({
        where: { code: activityCode }
      });

      if (!entityType) {
        console.error(`EntityType "${entityCode}" not found. Please run: npm run seed:activity`);
        return; // No lanzar error, solo loguear
      }

      if (!activityType) {
        console.error(`ActivityType "${activityCode}" not found. Please run: npm run seed:activity`);
        return;
      }

      // CREAR EL LOG SOLO SI EXISTEN LOS TIPOS
      await this.prisma.activityLog.create({
        data: {
          userId,
          entityId,
          description,
          oldData: oldData ?? undefined,
          newData: newData ?? undefined,
          isImportant,
          entityType: {
            connect: { code: entityCode },
          },
          activityType: {
            connect: { code: activityCode },
          },
        },
      });
    } catch (error) {
      console.error('Error logging activity', error);
      // No lanzar el error para evitar que se caiga la app
    }
  }
}
