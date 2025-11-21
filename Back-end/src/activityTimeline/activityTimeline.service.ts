
// src/activity-log/activity-log.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; 
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
  constructor(private readonly prisma: PrismaService) {}

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
      await this.prisma.activityLog.create({
        data: {
          userId,
          entityId,
          description,
          oldDat: oldData ?? null,
          newData: newData ?? null,
          isImportant,

          // conectamos por code porque en EntityType y ActivityType lo marcaste @unique
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
      // puedes decidir si lanzar el error o solo loguearlo
      // throw error;
    }
  }
}
