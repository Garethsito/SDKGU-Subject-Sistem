// src/sessions/sessions.module.ts
import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { ActivityLogModule } from '../activityTimeline/activityTimeline.module'; // 👈 IMPORTANTE

@Module({
  imports: [
    PrismaModule,
    MailModule,
    ActivityLogModule,   // 👈 aquí es donde Nest verá ActivityLogService
  ],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
