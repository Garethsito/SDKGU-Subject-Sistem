// src/grades/grades.module.ts
import { Module } from '@nestjs/common';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityLogModule } from '../activityTimeline/activityTimeline.module';

@Module({
  imports: [PrismaModule, ActivityLogModule],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService]
})
export class GradesModule {}