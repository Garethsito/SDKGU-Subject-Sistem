// Back-end/src/administrators/administrators.module.ts
import { Module } from '@nestjs/common';
import { AdministratorsController } from './administrators.controller';
import { AdministratorsService } from './administrators.services';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityLogModule } from '../activityTimeline/activityTimeline.module';

@Module({
  imports: [PrismaModule, ActivityLogModule],
  controllers: [AdministratorsController],
  providers: [AdministratorsService],
  exports: [AdministratorsService],
})
export class AdministratorsModule {}