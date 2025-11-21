// src/grades/grades.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';
import { ActivityLogService } from '../activityTimeline/activityTimeline.service'; // ajusta la ruta


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
  constructor(private prisma: PrismaService,
  private readonly activityLog: ActivityLogService
  ) {}

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

  //preparo variables para la auditoría
  let record;
  let activityCode: 'CREATE' | 'UPDATE';
  let oldData: any = null;

  if (existingRecord) {
    // si ya existía, es un UPDATE
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
        status,
        sessionId: sessionId ?? null
      },
      include: {
        course: true
      }
    });
  } else {
    // si no existía, es un CREATE
    activityCode = 'CREATE';

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

  // AQUÍ ES DONDE SE REGISTRA EN activity_log

  await this.activityLog.logActivity({
    userId: null, // más adelante puedes pasar el id del usuario autenticado
    entityCode: 'ACADEMIC_RECORD',   // necesita existir en entity_type
    entityId: Number(record.id),
    activityCode,                    // 'CREATE' o 'UPDATE'
    description: `Grade ${activityCode === 'CREATE' ? 'created' : 'updated'} for student ${studentId} in course ${courseCode}`,
    oldData,
    newData: {
      id: Number(record.id),
      studentId: Number(studentId),
      courseId: record.courseId,
      sessionId: sessionId ?? null,
      grade,
      status,
    },
    isImportant: true,
  });

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

        // preparamos variables para el log
        let activityCode: 'CREATE' | 'UPDATE';
        let oldData: any = null;
        let recordId: number;

        if (existingRecord) {
          activityCode = 'UPDATE';
          recordId = Number(existingRecord.id);

          // datos "antes"
          oldData = {
            id:        Number(existingRecord.id),
            studentId: Number(existingRecord.studentId),
            courseId:  existingRecord.courseId,
            sessionId: existingRecord.sessionId,
            grade:     existingRecord.grade,
            status:    existingRecord.status,
          };

          await this.prisma.academicRecord.update({
            where: { id: existingRecord.id },
            data: {
              grade,
              status,
              sessionId: sessionId ?? null
            }
          });
        } else {
          activityCode = 'CREATE';

          const newRecord = await this.prisma.academicRecord.create({
            data: {
              studentId,
              courseId: course.id,
              sessionId: sessionId ?? null,
              grade,
              status
            }
          });

          recordId = Number(newRecord.id);
          // en CREATE normalmente oldData = null
        }

        // registrar en activity_log para *esta* calificación
        await this.activityLog.logActivity({
          userId: null, // más adelante puedes pasar el id del usuario que hace el batch
          entityCode: 'ACADEMIC_RECORD', // o el code que hayas definido en entity_type
          entityId: recordId,
          activityCode,
          description: `Batch grade ${activityCode === 'CREATE' ? 'created' : 'updated'} for student ${studentId.toString()} in course ${courseCode}`,
          oldData,
          newData: {
            id:        recordId,
            studentId: Number(studentId),
            courseId:  course.id,
            sessionId: sessionId ?? null,
            grade,
            status,
          },
          isImportant: true,
        });

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

    // 1) Obtener los registros que se van a borrar
    const records = await this.prisma.academicRecord.findMany({
      where: {
        studentId,
        courseId: course.id
      }
    });

    // Si no hay nada que borrar, igual puedes regresar éxito "vacío"
    if (!records.length) {
      return {
        success: true,
        message: 'No se encontró ninguna calificación para eliminar'
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
          id:        Number(record.id),
          studentId: Number(record.studentId),
          courseId:  record.courseId,
          sessionId: record.sessionId,
          grade:     record.grade,
          status:    record.status,
        },
        newData: null,
        isImportant: true,
      });
    }

    // 3) Ahora sí borrar en BD
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