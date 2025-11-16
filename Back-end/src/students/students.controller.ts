// Back-end/src/students/students.controller.ts
import { Controller, Get } from '@nestjs/common';
import { StudentsService } from './students.service';

@Controller('api/students')
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
  ) {}

  @Get('count')
  async getTotalStudents() {
    const total = await this.studentsService.countStudents();
    return { total };
  }

  @Get('distribution')
  async getStudentDistribution() {
    const distribution = await this.studentsService.getDistribution();
    return distribution;
  }

  @Get('enrollment-growth')
  async getEnrollmentGrowth() {
    const growth = await this.studentsService.calculateEnrollmentGrowth();
    return { growth };
  }

  @Get('missing-subjects')
  async getMissingSubjects() {
    try {
      const missingSubjects = await this.studentsService.getMissingSubjectsByStudent();
      console.log('📊 Missing Subjects Response:', missingSubjects);
      return { missingSubjects };
    } catch (error) {
      console.error('❌ Error in missing-subjects endpoint:', error);
      return { 
        missingSubjects: { 
          labels: [], 
          data: [] 
        } 
      };
    }
  }
}