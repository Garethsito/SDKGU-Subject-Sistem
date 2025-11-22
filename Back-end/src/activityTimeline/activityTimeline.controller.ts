// src/activity-log/activity-timeline.controller.ts
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';

@Controller('activity-timeline') // base: /activity-timeline
export class ActivityTimelineController {
    constructor(private readonly prisma: PrismaService) {}

    @Get('recent') // GET /activity-timeline/recent
    async getRecentActivities() {
        const logs = await this.prisma.activityLog.findMany({
        take: 100,
        orderBy: { occurredAt: 'desc' },
        include: {
            entityType: true,
            activityType: true,
        },
        });

        // Transformar los registros de BD al formato que espera el HTML
        return logs.map((log) => {
        const occurred = log.occurredAt as unknown as Date;

        // mapear codes a los "type" del HTML
        const type = mapActivityType(log.activityType.code, log.entityType.code);

        return {
            id: Number(log.id),
            type, // 'Login', 'Logout', 'Grade Update', etc.
            user: log.userId ? `User #${log.userId}` : 'System',
            description: log.description ?? '',
            details: log.newData ?? null,   // puedes combinar old/new si quieres
            date: occurred.toISOString().slice(0, 10),    // YYYY-MM-DD
            time: occurred.toTimeString().slice(0, 5),    // HH:MM
            ipAddress: '', // si no tienes IP, déjalo vacío o '-'
        };
        });
    }
}

// helper para traducir codes a los labels que usa el HTML
function mapActivityType(activityCode: string, entityCode: string): string {
  // 🔐 login/logout
    if (activityCode === 'LOGIN') return 'Login';
    if (activityCode === 'LOGOUT') return 'Logout';

    // 📊 calificaciones
    if (entityCode === 'ACADEMIC_RECORD') return 'Grade Update';

    // 🗓 sesiones
    if (entityCode === 'SESSION') return 'Session Assignment';

    // 👨‍🏫 asignación de profesor / course offering
    if (entityCode === 'COURSE_OFFERING') return 'Teacher Assignment';

    // 👨‍🎓 altas/bajas de estudiantes en curso
    if (entityCode === 'ENROLLMENT') return 'Student Added';

    // 📁 importaciones
    if (entityCode === 'IMPORT') return 'Data Import';

    return 'Other';
}
