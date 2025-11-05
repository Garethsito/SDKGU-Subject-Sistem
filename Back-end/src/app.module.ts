// src/app.module.ts

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { SessionsModule } from './sessions/sessions.module';
import { ProgramsController } from './programs/programs.controller';
import { CoursesController } from './courses/courses.controller';
import { TeachersController } from './teachers/teachers.controller';
import { PrismaService } from './prisma/prisma.services';

@Module({
  imports: [AuthModule, StudentsModule, SessionsModule],
  controllers: [AppController, ProgramsController, CoursesController, TeachersController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
