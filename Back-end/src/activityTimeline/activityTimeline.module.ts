// src/activity-log/activity-log.module.ts
import { Module } from '@nestjs/common';
import { ActivityLogService } from './activityTimeline.service';
import { ActivityTimelineController } from './activityTimeline.controller';
import { PrismaModule } from '../prisma/prisma.module'; 

@Module({
    imports: [PrismaModule],                       
    controllers: [ActivityTimelineController],
    providers: [ActivityLogService],
    exports: [ActivityLogService],                
})
export class ActivityLogModule {}
