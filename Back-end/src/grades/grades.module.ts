// src/grades/grades.module.ts
import { Module } from '@nestjs/common';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityLogModule } from '../activityTimeline/activityTimeline.module'; // 👈 nuevo import

@Module({
  imports: [
    PrismaModule,
    ActivityLogModule, // 👈 aquí Nest ya podrá inyectar ActivityLogService
  ],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService],
})
export class GradesModule {}
