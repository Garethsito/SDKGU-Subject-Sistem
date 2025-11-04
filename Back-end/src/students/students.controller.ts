// Back-end/src/students/students.controller.ts
import { Controller, Get } from '@nestjs/common';
import { StudentsService } from './students.service';

@Controller('api/students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

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
}
