
// src/activity-log/activity-log.module.ts
import { Module } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { PrismaService } from '../prisma/prisma.service'; // ajusta ruta

@Module({
    providers: [ActivityLogService, PrismaService],
    exports: [ActivityLogService], // <- para poder inyectarlo en otros módulos
})
export class ActivityLogModule {}
