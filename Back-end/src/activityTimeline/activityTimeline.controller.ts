// src/activityTimeline/activityTimeline.controller.ts
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';

@Controller('activityTimeline')
export class ActivityTimelineController {
    constructor(private readonly prisma: PrismaService) {}

    @Get('recent')
    async getRecentActivities() {
        const logs = await this.prisma.activityLog.findMany({
            take: 100,
            orderBy: { occurredAt: 'desc' },
            include: {
                entityType: true,
                activityType: true,
            },
        });

        return logs.map((log: any) => {
            const occurred = new Date(log.occurredAt);

            const activityCode = log.activityType?.code ?? 'UNKNOWN';
            const entityCode   = log.entityType?.code ?? 'UNKNOWN';

            const typeLabel = mapActivityType(activityCode, entityCode);

            return {
                id: Number(log.id),
                type: typeLabel,              // lo que usa el HTML para colores / íconos
                activityCode,                 // por si luego quieres filtros avanzados
                entityCode,
                user: log.userId ? `User #${log.userId}` : 'System',
                description: log.description ?? '',
                details: log.newData ?? null,
                date: occurred.toISOString().slice(0, 10),
                time: occurred.toTimeString().slice(0, 5),
                isImportant: !!log.isImportant,
            };
        });
    }
}

function mapActivityType(activityCode: string, entityCode: string): string {
    // login/logout
    if (activityCode === 'LOGIN')        return 'Login';
    if (activityCode === 'LOGIN_FAILED') return 'Login Failed';
    if (activityCode === 'LOGOUT')       return 'Logout';

    // arranque de sesión académica
    if (activityCode === 'START_SESSION' || (activityCode === 'CREATE' && entityCode === 'SESSION')) {
        return 'Session Start';
    }

    // cambios de calificaciones
    if (entityCode === 'ACADEMIC_RECORD') return 'Grade Update';

    // sesiones
    if (entityCode === 'SESSION') return 'Session Update';

    // asignaciones de materia / maestro
    if (entityCode === 'COURSE_OFFERING') return 'Teacher Assignment';

    // altas/bajas en curso
    if (entityCode === 'ENROLLMENT') {
        if (activityCode === 'CREATE') return 'Student Added';
        if (activityCode === 'DELETE') return 'Student Removed';
        return 'Enrollment Change';
    }

    // importaciones
    if (entityCode === 'IMPORT' || activityCode === 'IMPORT') return 'Data Import';

    // reportes
    if (entityCode === 'REPORT' || activityCode === 'REQUEST_REPORT') return 'Report Request';

    return 'Other';
}
