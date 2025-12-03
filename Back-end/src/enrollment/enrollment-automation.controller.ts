// src/enrollment/enrollment-automation.controller.ts
import { Controller, Get, Post, Param, Body, ParseIntPipe } from '@nestjs/common';
import { 
  EnrollmentAutomationService,
  CourseAnalysis 
} from './enrollment-automation.service';

@Controller('api/enrollment-automation')
export class EnrollmentAutomationController {
  constructor(
    private readonly automationService: EnrollmentAutomationService
  ) {}

  /**
   * GET /api/enrollment-automation/analyze
   * Analizar demanda de todas las materias
   */
@Get('analyze')
async analyzeDemand(): Promise<CourseAnalysis[]> {
  try {
    return await this.automationService.analyzeDemandForAllCourses();
  } catch (error) {
    console.error('Error analyzing demand:', error);
    throw error;
  }
}

  /**
   * POST /api/enrollment-automation/auto-enroll
   * Inscribir automáticamente estudiantes
   */
  @Post('auto-enroll')
  async autoEnroll(@Body() body: {
    sessionId: number;
    courseId: number;
    maxStudents?: number;
  }) {
    return this.automationService.autoEnrollStudents(
      body.sessionId,
      body.courseId,
      body.maxStudents || 50
    );
  }

  /**
   * POST /api/enrollment-automation/add-to-session
   * Agregar materia a sesión activa
   */
  @Post('add-to-session')
  async addCourseToActiveSession(@Body() body: {
    courseId: number;
    programId: number;
    createNewGroup?: boolean;
  }) {
    return this.automationService.addCourseToActiveSession(
      body.courseId,
      body.programId,
      body.createNewGroup || false
    );
  }
}