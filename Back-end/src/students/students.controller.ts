// Back-end/src/students/students.controller.ts
import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { StudentsService } from './students.service';

@Controller('api/students')
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
  ) { }

  // IMPORTANTE: Las rutas específicas DEBEN ir ANTES de las rutas con parámetros

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
      //console.log('Missing Subjects Response:', missingSubjects);
      return { missingSubjects };
    } catch (error) {
      console.error('Error in missing-subjects endpoint:', error);
      return {
        missingSubjects: {
          labels: [],
          data: []
        }
      };
    }
  }

  @Get()
  async getAllStudents() {
    try {
      console.log('🔍 Fetching all students...');
      const students = await this.studentsService.getAllStudents();
      console.log(`Returning ${students.length} students`);

      // DEBUG: Ver estructura del primer estudiante
      if (students.length > 0) {
        console.log('Sample student structure:', {
          id: students[0].id,
          name: `${students[0].firstName} ${students[0].lastName}`,
          program: students[0].program,
          hasGrades: !!students[0].grades
        });
      }

      return students;
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
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

  // 🆕 ENDPOINT PARA IMPORTAR ESTUDIANTES
  @Post('import')
  async importStudent(@Body() studentData: any) {
    try {
      console.log('📥 Importing student:', studentData);
      
      const result = await this.studentsService.importStudent(studentData);
      
      return {
        success: true,
        message: 'Student imported successfully',
        student: result
      };
    } catch (error) {
      console.error('❌ Error importing student:', error);
      
      return {
        success: false,
        message: error.message || 'Failed to import student'
      };
    }
  }
}