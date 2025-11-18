// Back-end/src/students/students.controller.ts
import { Controller, Get, Patch, Param, Body, NotFoundException } from '@nestjs/common';
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

  @Get(':id')
  async getStudentById(@Param('id') id: string) {
    try {
      const student = await this.studentsService.getStudentById(BigInt(id));
      return student;
    } catch (error) {
      console.error('Error fetching student:', error);
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
  }

  @Get()
  async getAllStudents() {
    try {
      const students = await this.studentsService.getAllStudents();
      return students;
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  }

  // ✅ NUEVO: Endpoint para actualizar el estado del estudiante
  @Patch(':id')
  async updateStudentStatus(
    @Param('id') id: string,
    @Body() updateData: { status: string }
  ) {
    try {
      const studentId = BigInt(id);
      const updatedStudent = await this.studentsService.updateStudentStatus(
        studentId,
        updateData.status
      );
      
      console.log(`✅ Student ${id} status updated to: ${updateData.status}`);
      return updatedStudent;
    } catch (error) {
      console.error('Error updating student status:', error);
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
  }
}