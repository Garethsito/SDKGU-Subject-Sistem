// src/sessions/sessions.module.ts
import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { PrismaService } from '../prisma/prisma.services';

import { SessionsController } from './sessions.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [SessionsController],
  providers: [SessionsService, PrismaService],
})
export class SessionsModule {}
