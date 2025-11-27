// src/grades/grades.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';

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

// 🔥 FUNCIÓN GLOBAL DE NORMALIZACIÓN
function normalizeStatus(input?: string, grade?: string): string {
  if (!input && grade) input = grade;
  const s = input?.toLowerCase().trim();

  if (!s || s === '--' || s === 'ip') return 'pending';

  if (['c', 'completed', 'completado', 'pass', 'aprobado'].includes(s))
    return 'completed';

  if (['f', 'failed', 'fail', 'reprobado'].includes(s))
    return 'failed';

  if (['t', 'transfer', 'transferred', 'transferido'].includes(s))
    return 'transferred';

  return 'pending';
}

@Injectable()
export class GradesService {
  constructor(private prisma: PrismaService) {}

  // Obtener todas las calificaciones
  async getStudentGrades(studentId: bigint) {
    return this.prisma.academicRecord.findMany({
      where: { studentId },
      include: { course: true, session: true },
      orderBy: { course: { courseCode: 'asc' } }
    });
  }

  // Actualizar o crear una calificación
  async updateGrade(
    studentId: bigint,
    courseCode: string,
    grade: string,
    status?: string,
    sessionId?: number
  ) {
    const course = await this.prisma.course.findUnique({ where: { courseCode } });

    if (!course) throw new NotFoundException(`Curso ${courseCode} no encontrado`);

    const normalizedStatus = normalizeStatus(status, grade);

    const existingRecord = await this.prisma.academicRecord.findFirst({
      where: { studentId, courseId: course.id, sessionId: sessionId ?? null }
    });

    let record;

    if (existingRecord) {
      record = await this.prisma.academicRecord.update({
        where: { id: existingRecord.id },
        data: {
          grade,
          status: normalizedStatus,
          sessionId: sessionId ?? null
        },
        include: { course: true }
      });
    } else {
      record = await this.prisma.academicRecord.create({
        data: {
          studentId,
          courseId: course.id,
          sessionId: sessionId ?? null,
          grade,
          status: normalizedStatus
        },
        include: { course: true }
      });
    }

    return {
      success: true,
      message: `Calificación actualizada: ${courseCode} - ${grade}`,
      record
    };
  }

  // Actualizar múltiples calificaciones (IMPORT/EXCEL)
  async batchUpdateGrades(
    studentId: bigint,
    grades: Array<{ courseCode: string; grade: string; sessionId?: number; status?: string }>
  ): Promise<BatchUpdateResult> {
    const results: GradeResult[] = [];
    const errors: string[] = [];

    for (const g of grades) {
      try {
        const course = await this.prisma.course.findUnique({
          where: { courseCode: g.courseCode }
        });

        if (!course) {
          errors.push(`Curso ${g.courseCode} no encontrado`);
          continue;
        }

        const normalizedStatus = normalizeStatus(g.status, g.grade);

        const existing = await this.prisma.academicRecord.findFirst({
          where: {
            studentId,
            courseId: course.id,
            sessionId: g.sessionId ?? null
          }
        });

        if (existing) {
          await this.prisma.academicRecord.update({
            where: { id: existing.id },
            data: {
              grade: g.grade,
              status: normalizedStatus,
              sessionId: g.sessionId ?? null
            }
          });
        } else {
          await this.prisma.academicRecord.create({
            data: {
              studentId,
              courseId: course.id,
              sessionId: g.sessionId ?? null,
              grade: g.grade,
              status: normalizedStatus
            }
          });
        }

        results.push({ courseCode: g.courseCode, grade: g.grade, success: true });

      } catch (e: any) {
        errors.push(`Error en ${g.courseCode}: ${e.message}`);
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
    const course = await this.prisma.course.findUnique({ where: { courseCode } });

    if (!course) throw new NotFoundException('Curso no encontrado');

    await this.prisma.academicRecord.deleteMany({
      where: { studentId, courseId: course.id }
    });

    return { success: true, message: 'Calificación eliminada' };
  }

  // Obtener estudiantes con calificaciones
  async getAllStudentsWithGrades() {
    return this.prisma.student.findMany({
      where: { status: 'active' },
      include: {
        program: { include: { programCourses: { include: { course: true } } } },
        records: { include: { course: true } },
        transfers: { include: { course: true } }
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
    });
  }

  // Obtener todas las materias
  async getAllSubjects() {
    return this.prisma.course.findMany();
  }

  // Recomendaciones globales
  async getGlobalRecommendations() {
    const courses = await this.prisma.course.findMany();
    const students = await this.prisma.student.findMany({
      include: { records: { include: { course: true } } }
    });

    const recommendations: {
  courseId: number;
  courseCode: string;
  courseName: string;
  missingCount: number;
  students: { id: bigint; fullName: string }[];
}[] = [];


    for (const course of courses) {
      const missing: { id: bigint; fullName: string }[] = [];

      for (const st of students) {
        const completed = st.records.map(r => r.courseId);

        if (!completed.includes(course.id)) {
          missing.push({
            id: st.id,
            fullName: `${st.firstName} ${st.middleName ?? ''} ${st.lastName}`.trim()
          });
        }
      }

      recommendations.push({
        courseId: course.id,
        courseCode: course.courseCode,
        courseName: course.courseName,
        missingCount: missing.length,
        students: missing
      });
    }

    return recommendations;
  }
}
