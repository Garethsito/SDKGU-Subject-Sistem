// Back-end/src/courses/courses.module.ts
import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { PrismaService } from '../prisma/prisma.services';
import { ActivityLogModule } from '../activityTimeline/activityTimeline.module';

@Module({
  imports: [ActivityLogModule],
  controllers: [CoursesController],
  providers: [CoursesService, PrismaService],
  exports: [CoursesService],
})
export class CoursesModule {}