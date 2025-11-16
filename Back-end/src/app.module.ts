// src/app.module.ts

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { SessionsModule } from './sessions/sessions.module';
import { CoursesModule } from './courses/courses.module';
import { ProgramsModule } from './programs/programs.module';
import { TeachersModule } from './teachers/teachers.module';
import { PrismaService } from './prisma/prisma.services';

@Module({
  imports: [AuthModule, StudentsModule, SessionsModule, CoursesModule, ProgramsModule, TeachersModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
