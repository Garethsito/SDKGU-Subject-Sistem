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
  async updateGrade(
    studentId: bigint,
    courseCode: string,
    grade: string,
    sessionId?: number
  ) {
    // Buscar el curso por código
    const course = await this.prisma.course.findUnique({
      where: { courseCode }
    });

    if (!course) {
      throw new NotFoundException(`Curso ${courseCode} no encontrado`);
    }

    // Determinar el status basado en la calificación
    const status = (grade === '--' || grade === 'IP') ? 'pendiente' : 'completado';

    // Buscar si ya existe un registro
    const existingRecord = await this.prisma.academicRecord.findFirst({
      where: {
        studentId,
        courseId: course.id,
        sessionId: sessionId ?? null
      }
    });

    let record;
    if (existingRecord) {
      // Actualizar
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
      // Crear
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
    grades: Array<{ courseCode: string; grade: string; sessionId?: number }>
  ): Promise<BatchUpdateResult> {
    const results: GradeResult[] = []; // Tipar explícitamente
    const errors: string[] = []; // Tipar explícitamente

    for (const gradeData of grades) {
      try {
        const { courseCode, grade, sessionId } = gradeData;

        // Buscar curso
        const course = await this.prisma.course.findUnique({
          where: { courseCode }
        });

        if (!course) {
          errors.push(`Curso ${courseCode} no encontrado`); // Sin acento grave
          continue;
        }

        const status = (grade === '--' || grade === 'IP') ? 'pendiente' : 'completado';

        // Buscar si ya existe un registro
        const existingRecord = await this.prisma.academicRecord.findFirst({
          where: {
            studentId,
            courseId: course.id,
            sessionId: sessionId ?? null
          }
        });

        if (existingRecord) {
          // Actualizar
          await this.prisma.academicRecord.update({
            where: { id: existingRecord.id },
            data: {
              grade,
              status,
              sessionId: sessionId ?? null
            }
          });
        } else {
          // Crear
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
        errors.push(`Error en ${gradeData.courseCode}: ${error.message}`); // Sin acento grave
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