// src/grades/grades.controller.ts

import { Controller, Get, Post, Delete, Param, Body, HttpException, HttpStatus, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GradesService, BatchUpdateResult } from './grades.service';
import * as XLSX from 'xlsx';

// DTOs
export class UpdateGradeDto {
  courseCode: string;
  grade: string;
  sessionId?: number;
}

export class BatchUpdateGradesDto {
  grades: UpdateGradeDto[];
}

@Controller('api')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  // ⚡ Función para serializar BigInt a string
  private serializeBigInt(obj: any): any {
    if (typeof obj === 'bigint') return obj.toString();
    if (Array.isArray(obj)) return obj.map(o => this.serializeBigInt(o));
    if (obj && typeof obj === 'object') {
      const res: any = {};
      for (const key in obj) {
        res[key] = this.serializeBigInt(obj[key]);
      }
      return res;
    }
    return obj;
  }

  // 🆕 GET - Recomendaciones globales (DEBE IR PRIMERO)
  @Get('recommendations')
  async getGlobalRecommendations() {
    try {
      console.log('📊 Obteniendo recomendaciones globales...');
      const recommendations = await this.gradesService.getGlobalRecommendations();
      return this.serializeBigInt(recommendations);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error al obtener recomendaciones',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // GET - Obtener calificaciones de un estudiante
  @Get('students/:studentId/grades')
  async getStudentGrades(@Param('studentId') studentId: string) {
    try {
      const id = BigInt(studentId);
      const grades = await this.gradesService.getStudentGrades(id);
      return this.serializeBigInt(grades);
    } catch (error) {
      console.error('Error fetching grades:', error);
      throw new HttpException(
        { 
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR, 
          message: 'Error al obtener calificaciones', 
          error: error.message 
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // POST - Actualizar/crear calificación
  @Post('students/:studentId/grades')
  async updateGrade(
    @Param('studentId') studentId: string,
    @Body() updateGradeDto: UpdateGradeDto
  ) {
    try {
      const id = BigInt(studentId);
      const { courseCode, grade, sessionId } = updateGradeDto;

      if (!courseCode || !grade) {
        throw new HttpException('courseCode y grade son requeridos', HttpStatus.BAD_REQUEST);
      }

      const res = await this.gradesService.updateGrade(id, courseCode, grade, sessionId);
      return this.serializeBigInt(res);
    } catch (error) {
      console.error('Error updating grade:', error);
      if (error instanceof HttpException) throw error;
      throw new HttpException('Error al actualizar calificación', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // POST - Actualizar múltiples calificaciones (batch)
  @Post('students/:studentId/grades/batch')
  async batchUpdateGrades(
    @Param('studentId') studentId: string,
    @Body() batchUpdateDto: BatchUpdateGradesDto
  ): Promise<BatchUpdateResult> {
    try {
      const id = BigInt(studentId);
      const { grades } = batchUpdateDto;
      if (!Array.isArray(grades)) {
        throw new HttpException('grades debe ser un array', HttpStatus.BAD_REQUEST);
      }

      const res = await this.gradesService.batchUpdateGrades(id, grades);
      return this.serializeBigInt(res);
    } catch (error) {
      console.error('Error in batch update:', error);
      throw new HttpException('Error al actualizar calificaciones', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // DELETE - Eliminar calificación
  @Delete('students/:studentId/grades/:courseCode')
  async deleteGrade(
    @Param('studentId') studentId: string,
    @Param('courseCode') courseCode: string
  ) {
    try {
      const id = BigInt(studentId);
      const res = await this.gradesService.deleteGrade(id, courseCode);
      return this.serializeBigInt(res);
    } catch (error) {
      console.error('Error deleting grade:', error);
      throw new HttpException('Error al eliminar calificación', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // POST - Importar calificaciones desde Excel
  @Post('import/grades')
  @UseInterceptors(FileInterceptor('file'))
  async importGrades(@UploadedFile() file: Express.Multer.File) {
    try {
      if (!file) throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);

      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);

      if (!rows.length) throw new HttpException('Excel file is empty', HttpStatus.BAD_REQUEST);

      const results: any[] = [];

      for (const row of rows) {
        const { studentId, courseCode, grade, sessionId } = row;
        if (!studentId || !courseCode || !grade) {
          console.warn('Skipping incomplete row:', row);
          continue;
        }

        const res = await this.gradesService.updateGrade(BigInt(studentId), courseCode, grade, sessionId ?? null);
        results.push(this.serializeBigInt(res));
      }

      return {
        success: true,
        message: 'Grades imported successfully',
        recordsProcessed: results.length,
        results
      };
    } catch (error) {
      console.error('Error importing grades:', error);
      throw new HttpException('Error importing grades', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}