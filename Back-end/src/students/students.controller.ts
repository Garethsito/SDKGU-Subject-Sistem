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
}
