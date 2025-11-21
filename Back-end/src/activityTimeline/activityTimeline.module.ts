// src/activity-log/activity-log.module.ts
import { Module } from '@nestjs/common';
import { ActivityLogService } from './activityTimeline.service'; // 👈 ruta al archivo renombrado
import { PrismaService } from '../prisma/prisma.service';

@Module({
    providers: [ActivityLogService, PrismaService],
    exports: [ActivityLogService],
})
export class ActivityLogModule {}