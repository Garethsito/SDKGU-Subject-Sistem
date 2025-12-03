// src/grades/grades.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services'; // ajusta si tu archivo se llama distinto
import { ActivityLogService } from '../activityTimeline/activityTimeline.service';

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

// 🔥 FUNCIÓN GLOBAL DE NORMALIZACIÓN (HEAD)
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
  ) {}

  // Obtener todas las calificaciones de un estudiante
  async getStudentGrades(studentId: bigint) {
    return this.prisma.academicRecord.findMany({
      where: { studentId },
      include: { course: true, session: true },
      orderBy: { course: { courseCode: 'asc' } },
    });
  }

  // Actualizar o crear una calificación (INDIVIDUAL) + auditoría
  async updateGrade(
    studentId: bigint,
    courseCode: string,
    grade: string,
    status?: string,
    sessionId?: number,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { courseCode },
    });

    if (!course) {
      throw new NotFoundException(`Curso ${courseCode} no encontrado`);
    }

    const normalizedStatus = normalizeStatus(status, grade);

    const existingRecord = await this.prisma.academicRecord.findFirst({
      where: {
        studentId,
        courseId: course.id,
        sessionId: sessionId ?? null,
      },
    });

    let record;
    let activityCode: 'CREATE' | 'UPDATE';
    let oldData: any = null;

    if (existingRecord) {
      activityCode = 'UPDATE';
      oldData = {
        id: Number(existingRecord.id),
        studentId: Number(existingRecord.studentId),
        courseId: existingRecord.courseId,
        sessionId: existingRecord.sessionId,
        grade: existingRecord.grade,
        status: existingRecord.status,
      };

      record = await this.prisma.academicRecord.update({
        where: { id: existingRecord.id },
        data: {
          grade,
          status: normalizedStatus,
          sessionId: sessionId ?? null,
        },
        include: { course: true },
      });
    } else {
      activityCode = 'CREATE';

      record = await this.prisma.academicRecord.create({
        data: {
          studentId,
          courseId: course.id,
          sessionId: sessionId ?? null,
          grade,
          status: normalizedStatus,
        },
        include: { course: true },
      });
    }

    // Registrar en activity_log
    await this.activityLog.logActivity({
      userId: null, // más adelante puedes pasar el id del usuario autenticado
      entityCode: 'ACADEMIC_RECORD', // necesita existir en entity_type
      entityId: Number(record.id),
      activityCode,
      description: `Grade ${activityCode === 'CREATE' ? 'created' : 'updated'} for student ${studentId.toString()} in course ${courseCode}`,
      oldData,
      newData: {
        id: Number(record.id),
        studentId: Number(studentId),
        courseId: record.courseId,
        sessionId: sessionId ?? null,
        grade,
        status: normalizedStatus,
      },
      isImportant: true,
    });

    return {
      success: true,
      message: `Calificación actualizada: ${courseCode} - ${grade}`,
      record,
    };
  }

  // Actualizar múltiples calificaciones (IMPORT/EXCEL) + auditoría
  async batchUpdateGrades(
    studentId: bigint,
    grades: Array<{ courseCode: string; grade: string; sessionId?: number; status?: string }>,
  ): Promise<BatchUpdateResult> {
    const results: GradeResult[] = [];
    const errors: string[] = [];

    for (const g of grades) {
      try {
        const course = await this.prisma.course.findUnique({
          where: { courseCode: g.courseCode },
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
            sessionId: g.sessionId ?? null,
          },
        });

        let activityCode: 'CREATE' | 'UPDATE';
        let oldData: any = null;
        let recordId: number;

        if (existing) {
          activityCode = 'UPDATE';
          recordId = Number(existing.id);

          oldData = {
            id: Number(existing.id),
            studentId: Number(existing.studentId),
            courseId: existing.courseId,
            sessionId: existing.sessionId,
            grade: existing.grade,
            status: existing.status,
          };

          await this.prisma.academicRecord.update({
            where: { id: existing.id },
            data: {
              grade: g.grade,
              status: normalizedStatus,
              sessionId: g.sessionId ?? null,
            },
          });
        } else {
          activityCode = 'CREATE';

          const newRecord = await this.prisma.academicRecord.create({
            data: {
              studentId,
              courseId: course.id,
              sessionId: g.sessionId ?? null,
              grade: g.grade,
              status: normalizedStatus,
            },
          });

          recordId = Number(newRecord.id);
        }

        // Registrar en activity_log para esta calificación
        await this.activityLog.logActivity({
          userId: null, // luego puedes pasar el id del usuario que hace el batch
          entityCode: 'ACADEMIC_RECORD',
          entityId: recordId,
          activityCode,
          description: `Batch grade ${activityCode === 'CREATE' ? 'created' : 'updated'} for student ${studentId.toString()} in course ${g.courseCode}`,
          oldData,
          newData: {
            id: recordId,
            studentId: Number(studentId),
            courseId: course.id,
            sessionId: g.sessionId ?? null,
            grade: g.grade,
            status: normalizedStatus,
          },
          isImportant: true,
        });

        results.push({
          courseCode: g.courseCode,
          grade: g.grade,
          success: true,
        });
      } catch (e: any) {
        errors.push(`Error en ${g.courseCode}: ${e.message}`);
      }
    }

    return {
      success: true,
      totalProcessed: grades.length,
      successful: results.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // Eliminar calificaciones de un curso para un estudiante + auditoría
  async deleteGrade(studentId: bigint, courseCode: string) {
    const course = await this.prisma.course.findUnique({
      where: { courseCode },
    });

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    // 1) Obtener los registros que se van a borrar
    const records = await this.prisma.academicRecord.findMany({
      where: {
        studentId,
        courseId: course.id,
      },
    });

    if (!records.length) {
      return {
        success: true,
        message: 'No se encontró ninguna calificación para eliminar',
      };
    }

    // 2) Registrar en activity_log antes de borrar
    for (const record of records) {
      await this.activityLog.logActivity({
        userId: null, // luego puedes pasar el id del usuario autenticado
        entityCode: 'ACADEMIC_RECORD',
        entityId: Number(record.id),
        activityCode: 'DELETE',
        description: `Deleted grade for student ${studentId.toString()} in course ${courseCode}`,
        oldData: {
          id: Number(record.id),
          studentId: Number(record.studentId),
          courseId: record.courseId,
          sessionId: record.sessionId,
          grade: record.grade,
          status: record.status,
        },
        newData: null,
        isImportant: true,
      });
    }

    // 3) Borrar en BD
    await this.prisma.academicRecord.deleteMany({
      where: {
        studentId,
        courseId: course.id,
      },
    });

    return {
      success: true,
      message: `Calificaciones eliminadas para ${courseCode}`,
    };
  }

  // Obtener estudiantes con calificaciones
  async getAllStudentsWithGrades() {
    return this.prisma.student.findMany({
      where: { status: 'active' },
      include: {
        program: {
          include: {
            programCourses: {
              include: {
                course: true,
              },
            },
          },
        },
        records: {
          include: {
            course: true,
          },
        },
        transfers: {
          include: {
            course: true,
          },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
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
          include: { course: true },
        },
      },
    });

    const recommendations: {
      courseId: number;
      courseCode: string;
      courseName: string;
      missingCount: number;
      students: { id: bigint; fullName: string }[];
    }[] = [];

    for (const course of courses) {
      const studentsMissing: { id: bigint; fullName: string }[] = [];

      for (const student of students) {
        const completed = student.records.map((r) => r.courseId);

        if (!completed.includes(course.id)) {
          studentsMissing.push({
            id: student.id,
            fullName: `${student.firstName} ${student.middleName ?? ''} ${student.lastName}`.trim(),
          });
        }
      }

      recommendations.push({
        courseId: course.id,
        courseCode: course.courseCode,
        courseName: course.courseName,
        missingCount: studentsMissing.length,
        students: studentsMissing,
      });
    }

    return recommendations;
  }
}
