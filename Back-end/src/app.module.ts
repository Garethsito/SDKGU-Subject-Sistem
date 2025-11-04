// src/app.module.ts

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { SessionsModule } from './sessions/sessions.module';

@Module({
  imports: [AuthModule, StudentsModule, SessionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
