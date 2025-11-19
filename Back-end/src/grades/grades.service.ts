// src/grades/grades.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';

// Interfaces para los tipos de retorno - EXPORTADAS
export interface GradeResult {
  courseCode: string;
  grade: string;
  success: boolean;
}

export interface BatchUpdateResult {
  success: boolean;
  totalProcessed: number;
  successful: number;
  results: GradeResult[];
  errors?: string[];
}

@Injectable()
export class GradesService {
  constructor(private prisma: PrismaService) {}

  // Obtener todas las calificaciones de un estudiante
  async getStudentGrades(studentId: bigint) {
    try {
      console.log('🔍 Service: Buscando calificaciones para:', studentId);
      
      const records = await this.prisma.academicRecord.findMany({
        where: { studentId },
        include: {
          course: true,
          session: true
        },
        orderBy: {
          course: {
            courseCode: 'asc'
          }
        }
      });

      console.log('✅ Service: Registros encontrados:', records.length);
      return records;
    } catch (error) {
      console.error('❌ Service Error:', error);
      throw error;
    }
  }

  // Actualizar o crear una calificación
  // grades.service.ts
async updateGrade(
  studentId: bigint,
  courseCode: string,
  grade: string,
  sessionId?: number
) {
  const course = await this.prisma.course.findUnique({
    where: { courseCode }
  });

  if (!course) {
    throw new NotFoundException(`Curso ${courseCode} no encontrado`);
  }

  // 🔥 MEJORAR LA LÓGICA DEL STATUS
  let status = 'pendiente';
  
  if (!grade || grade === '--' || grade === 'IP') {
    status = 'pendiente';
  } else if (grade === 'F') {
    status = 'reprobado';  // 🎯 IMPORTANTE: Reprobado si es F
  } else {
    status = 'completado';
  }

  const existingRecord = await this.prisma.academicRecord.findFirst({
    where: {
      studentId,
      courseId: course.id,
      sessionId: sessionId ?? null
    }
  });

  let record;
  if (existingRecord) {
    record = await this.prisma.academicRecord.update({
      where: { id: existingRecord.id },
      data: {
        grade,
        status,
        sessionId: sessionId ?? null
      },
      include: {
        course: true
      }
    });
  } else {
    record = await this.prisma.academicRecord.create({
      data: {
        studentId,
        courseId: course.id,
        sessionId: sessionId ?? null,
        grade,
        status
      },
      include: {
        course: true
      }
    });
  }

  return {
    success: true,
    message: `Calificación actualizada: ${courseCode} - ${grade}`,
    record
  };
}

  // Actualizar múltiples calificaciones
  async batchUpdateGrades(
  studentId: bigint,
  grades: Array<{ courseCode: string; grade: string; sessionId?: number; status?: string }>
): Promise<BatchUpdateResult> {
  const results: GradeResult[] = [];
  const errors: string[] = [];

  for (const gradeData of grades) {
    try {
      const { courseCode, grade, sessionId } = gradeData;

      const course = await this.prisma.course.findUnique({
        where: { courseCode }
      });

      if (!course) {
        errors.push(`Curso ${courseCode} no encontrado`);
        continue;
      }

      // 🔥 MEJORAR LA LÓGICA DEL STATUS
      let status = 'pendiente';
      
      if (!grade || grade === '--' || grade === 'IP') {
        status = 'pendiente';
      } else if (grade === 'F') {
        status = 'reprobado';  // 🎯 Reprobado si es F
      } else {
        status = 'completado';
      }

      const existingRecord = await this.prisma.academicRecord.findFirst({
        where: {
          studentId,
          courseId: course.id,
          sessionId: sessionId ?? null
        }
      });

      if (existingRecord) {
        await this.prisma.academicRecord.update({
          where: { id: existingRecord.id },
          data: {
            grade,
            status,
            sessionId: sessionId ?? null
          }
        });
      } else {
        await this.prisma.academicRecord.create({
          data: {
            studentId,
            courseId: course.id,
            sessionId: sessionId ?? null,
            grade,
            status
          }
        });
      }

      results.push({ courseCode, grade, success: true });

    } catch (error: any) {
      errors.push(`Error en ${gradeData.courseCode}: ${error.message}`);
    }
  }

  return {
    success: true,
    totalProcessed: grades.length,
    successful: results.length,
    results,
    errors: errors.length > 0 ? errors : undefined
  };
}

  // Eliminar una calificación
  async deleteGrade(studentId: bigint, courseCode: string) {
    const course = await this.prisma.course.findUnique({
      where: { courseCode }
    });

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    await this.prisma.academicRecord.deleteMany({
      where: {
        studentId,
        courseId: course.id
      }
    });

    return {
      success: true,
      message: 'Calificación eliminada'
    };
  }

  // src/grades/grades.service.ts

async getAllStudentsWithGrades() {
  return this.prisma.student.findMany({
    where: { status: 'active' },
    include: {
      program: {
        include: {
          programCourses: {
            include: {
              course: true
            }
          }
        }
      },
      records: {
        include: {
          course: true
        }
      },
      transfers: {
        include: {
          course: true
        }
      }
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
  });
}

/**
 * Devuelve todas las materias (table Course en tu esquema)
 */
async getAllSubjects() {
  return this.prisma.course.findMany();
}

// 📌 Obtener recomendaciones globales
async getGlobalRecommendations() {
  // 1️⃣ Obtener todos los cursos
  const courses = await this.prisma.course.findMany();

  // 2️⃣ Obtener todos los alumnos con sus registros y cursos
  const students = await this.prisma.student.findMany({
    include: {
      records: {
        include: { course: true }
      }
    }
  });

  // ⛔ ANTES: const recommendations = [];
  // ✔ AHORA:
  const recommendations: {
    courseId: number;
    courseCode: string;
    courseName: string;
    missingCount: number;
    students: { id: bigint; fullName: string }[];
  }[] = [];

  for (const course of courses) {
    // ⛔ ANTES: const studentsMissing = [];
    // ✔ AHORA:
    const studentsMissing: { id: bigint; fullName: string }[] = [];

    for (const student of students) {
      const completed = student.records.map(r => r.courseId);

      if (!completed.includes(course.id)) {
        studentsMissing.push({
          id: student.id,
          fullName: `${student.firstName} ${student.middleName ?? ""} ${student.lastName}`.trim()
        });
      }
    }

    recommendations.push({
      courseId: course.id,
      courseCode: course.courseCode,
      courseName: course.courseName,
      missingCount: studentsMissing.length,
      students: studentsMissing
    });
  }

  return recommendations;
}




}