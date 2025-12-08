// src/app.module.ts

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { SessionsModule } from './sessions/sessions.module';
import { CoursesModule } from './courses/courses.module';
import { ProgramsModule } from './programs/programs.module';
import { TeachersModule } from './teachers/teachers.module';
import { PrismaService } from './prisma/prisma.services';
import { ScheduleModule } from '@nestjs/schedule';
import { MailModule } from './mail/mail.module';
import { NotificationsModule } from './notifications/notifications.module';
import { GradesModule } from './grades/grades.module';

import { EnrollmentAutomationModule } from './enrollment/enrollment-automation.module';

@Module({
  imports: [AuthModule, StudentsModule, SessionsModule, CoursesModule, ProgramsModule, TeachersModule, ScheduleModule.forRoot(), MailModule, NotificationsModule, GradesModule, EnrollmentAutomationModule],
  controllers: [AppController],
  providers: [AppService, PrismaService, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule { }
