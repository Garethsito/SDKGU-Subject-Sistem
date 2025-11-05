// sessions/sessions.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Controller('api/sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  // Obtener todas las sesiones
  @Get()
  async getAllSessions() {
    return this.sessionsService.getAllSessions();
  }

  // Obtener una sesión por ID
  @Get(':id')
  async getSessionById(@Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.getSessionById(id);
  }

  // Obtener materias de una sesión con estudiantes
  @Get(':id/courses')
  async getSessionCourses(@Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.getSessionCourses(id);
  }

  // Obtener todos los profesores
  @Get('teachers/all')
  async getAllTeachers() {
    return this.sessionsService.getAllTeachers();
  }

  // Crear nueva sesión
  @Post()
  async create(@Body() data: any) {
    return this.sessionsService.createSession(data);
  }

  // Actualizar sesión (ahora incluye actualización de materias)
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.sessionsService.updateSession(id, data);
  }

  // Eliminar sesión
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.deleteSession(id);
  }

  // Obtener materias disponibles para una sesión
  @Get(':id/available-courses')
  async getAvailableCourses(@Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.getAvailableCourses(id);
  }

  // Agregar materia a sesión
  @Post(':id/courses')
  async addCourseToSession(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { courseId: number; maxStudents?: number }
  ) {
    return this.sessionsService.addCourseToSession(id, data.courseId, data.maxStudents);
  }

  // Eliminar materia de sesión
  @Delete(':sessionId/courses/:courseId')
  async removeCourseFromSession(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Param('courseId', ParseIntPipe) courseId: number
  ) {
    return this.sessionsService.removeCourseFromSession(sessionId, courseId);
  }

  // Obtener estudiantes disponibles para una materia
  @Get(':sessionId/courses/:courseId/available-students')
  async getAvailableStudents(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Param('courseId', ParseIntPipe) courseId: number
  ) {
    return this.sessionsService.getAvailableStudents(sessionId, courseId);
  }

  // Agregar estudiante a una materia
  @Post(':sessionId/courses/:courseId/students')
  async addStudentToCourse(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() data: { studentId: string }
  ) {
    return this.sessionsService.addStudentToCourse(
      sessionId, 
      courseId, 
      BigInt(data.studentId)
    );
  }

  // Remover estudiante de una materia
  @Delete('enrollments/:enrollmentId')
  async removeStudentFromCourse(
    @Param('enrollmentId', ParseIntPipe) enrollmentId: number
  ) {
    return this.sessionsService.removeStudentFromCourse(enrollmentId);
  }
}