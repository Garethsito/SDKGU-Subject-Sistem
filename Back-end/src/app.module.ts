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
import { GradesModule } from './grades/grades.module'; // 🆕 Agregar esta línea

@Module({
  imports: [AuthModule, StudentsModule, SessionsModule, CoursesModule, ProgramsModule, TeachersModule, GradesModule], // 🆕 Agregar GradesModule aquí
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
