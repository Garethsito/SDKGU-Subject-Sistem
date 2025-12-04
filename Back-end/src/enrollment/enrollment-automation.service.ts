// src/enrollment/enrollment-automation.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';

export interface StudentPriority {
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  studentNumber: string;
  priority: number;
  reason: string;
  attemptsUsed: number;
}

export interface CourseAnalysis {
  courseId: number;
  courseCode: string;
  courseName: string;
  totalDemand: number;
  eligibleStudents: StudentPriority[];
  groupsNeeded: number;
  programIds: number[];
}

@Injectable()
export class EnrollmentAutomationService {
  constructor(private prisma: PrismaService) { }

  /**
   * 🎯 MÉTODO PRINCIPAL: Analizar demanda y determinar qué materias abrir
   */
  async analyzeDemandForAllCourses(): Promise<CourseAnalysis[]> {
    // 1. Obtener todos los cursos
    const allCourses = await this.prisma.course.findMany({
      include: {
        programCourses: true,
        prerequisites: {
          include: {
            prerequisiteCourse: true
          }
        }
      }
    });

    // 2. Obtener todos los estudiantes activos
    const activeStudents = await this.prisma.student.findMany({
      where: { status: 'active' },
      include: {
        records: {
          include: { course: true }
        },
        transfers: {
          include: { course: true }
        },
        program: true
      }
    });

    const analyses: CourseAnalysis[] = [];

    // 3. Para cada curso, calcular demanda
    for (const course of allCourses) {
      const eligibleStudents = await this.getEligibleStudentsForCourse(
        course,
        activeStudents
      );

      if (eligibleStudents.length > 0) {
        const groupsNeeded = Math.ceil(eligibleStudents.length / 50);

        analyses.push({
          courseId: course.id,
          courseCode: course.courseCode,
          courseName: course.courseName,
          totalDemand: eligibleStudents.length,
          eligibleStudents: eligibleStudents,
          groupsNeeded: groupsNeeded,
          programIds: course.programCourses.map(pc => pc.programId)
        });
      }
    }

    // 4. Ordenar por demanda descendente
    return analyses.sort((a, b) => b.totalDemand - a.totalDemand);
  }

  /**
   * 🔍 Obtener estudiantes elegibles para un curso
   */
  private async getEligibleStudentsForCourse(
    course: any,
    allStudents: any[]
  ): Promise<StudentPriority[]> {
    const eligible: StudentPriority[] = [];
    const programIds = course.programCourses.map((pc: any) => pc.programId);

    for (const student of allStudents) {
      // Verificar que el estudiante esté en un programa relacionado
      if (!programIds.includes(student.programId)) {
        continue;
      }

      // 1. ¿Ya aprobó el curso?
      const hasPassedCourse = student.records.some((r: any) =>
        r.courseId === course.id &&
        ['passed', 'completed', 'P'].includes(r.status?.toLowerCase() || '')
      );

      if (hasPassedCourse) continue;

      // 2. ¿Ya tiene transferencia?
      const hasTransfer = student.transfers.some((t: any) =>
        t.courseId === course.id
      );

      if (hasTransfer) continue;

      // 3. Contar intentos (cuántas veces ha cursado/reprobado)
      const attempts = student.records.filter((r: any) =>
        r.courseId === course.id
      ).length;

      if (attempts >= 2) {
        // Ya usó sus 2 oportunidades, no es elegible
        continue;
      }

      // 4. Verificar prerequisitos
      const hasPrerequisites = await this.hasCompletedPrerequisites(
        student,
        course
      );

      if (!hasPrerequisites) continue;

      // 5. Calcular prioridad
      const priority = this.calculateStudentPriority(student, attempts);

      eligible.push({
        studentId: student.id.toString(),
        studentFirstName: student.firstName,
        studentLastName: student.lastName,
        studentNumber: student.studentNumber,
        priority: priority,
        reason: this.getPriorityReason(student, attempts),
        attemptsUsed: attempts
      });
    }

    // Ordenar por prioridad (mayor a menor)
    return eligible.sort((a, b) => b.priority - a.priority);
  }

  /**
   * ✅ Verificar si el estudiante cumple prerequisitos
   */
  private async hasCompletedPrerequisites(
    student: any,
    course: any
  ): Promise<boolean> {
    if (!course.prerequisites || course.prerequisites.length === 0) {
      return true; // No tiene prerequisitos
    }

    const prerequisiteIds = course.prerequisites.map(
      (p: any) => p.prerequisiteCourseId
    );

    for (const prereqId of prerequisiteIds) {
      const hasPassed = student.records.some((r: any) =>
        r.courseId === prereqId &&
        ['passed', 'completed', 'P'].includes(r.status?.toLowerCase() || '')
      );

      const hasTransfer = student.transfers.some((t: any) =>
        t.courseId === prereqId
      );

      if (!hasPassed && !hasTransfer) {
        return false; // Falta un prerequisito
      }
    }

    return true;
  }

  /**
   * 🎖️ Calcular prioridad del estudiante
   */
  private calculateStudentPriority(student: any, attempts: number): number {
    let priority = 1000; // Base

    // 1. Cercanía a egreso (más créditos = mayor prioridad)
    const completionPercentage = (student.totalUnits && student.totalUnits > 0) ? student.totalUnitsEarned / student.totalUnits : 0;
    priority += completionPercentage * 500;

    // 2. Segunda oportunidad (recursadores)
    if (attempts === 1) {
      priority += 300; // Alta prioridad para recursadores
    }

    // 3. Fecha de inicio (alumnos más antiguos)
    const yearsEnrolled =
      (Date.now() - new Date(student.startDate).getTime()) /
      (1000 * 60 * 60 * 24 * 365);
    priority += yearsEnrolled * 50;

    return Math.round(priority);
  }

  /**
   * 📝 Obtener razón de prioridad
   */
  private getPriorityReason(student: any, attempts: number): string {
    const completionPercentage = (student.totalUnits && student.totalUnits > 0) ? Math.round((student.totalUnitsEarned / student.totalUnits) * 100) : 0;

    if (attempts === 1) {
      return `Second attempt - ${completionPercentage}% complete`;
    }

    if (completionPercentage >= 80) {
      return `Near graduation - ${completionPercentage}% complete`;
    }

    return `Regular student - ${completionPercentage}% complete`;
  }

  /**
   * 🚀 INSCRIBIR AUTOMÁTICAMENTE estudiantes a un curso en una sesión
   */
  async autoEnrollStudents(
    sessionId: number,
    courseId: number,
    maxStudents: number = 50
  ): Promise<any> {
    // 1. Obtener análisis del curso
    const allAnalyses = await this.analyzeDemandForAllCourses();
    const courseAnalysis = allAnalyses.find(a => a.courseId === courseId);

    if (!courseAnalysis) {
      return {
        success: false,
        message: 'No eligible students found for this course'
      };
    }

    // 2. Verificar que existe el CourseOffering
    const offering = await this.prisma.courseOffering.findUnique({
      where: {
        courseId_sessionId: { courseId, sessionId }
      }
    });

    if (!offering) {
      return {
        success: false,
        message: 'Course offering not found in this session'
      };
    }

    // 3. Inscribir a los primeros N estudiantes (hasta maxStudents)
    const studentsToEnroll = courseAnalysis.eligibleStudents.slice(0, maxStudents);
    const enrolled: any[] = [];
    const errors: string[] = [];

    for (const sp of studentsToEnroll) {
      try {
        // Verificar si ya está inscrito
        const existing = await this.prisma.enrollment.findUnique({
          where: {
            studentId_offeringId: {
              studentId: BigInt(sp.studentId),
              offeringId: offering.id
            }
          }
        });

        if (existing) {
          errors.push(`${sp.studentFirstName} ${sp.studentLastName} already enrolled`);
          continue;
        }

        // Crear inscripción
        await this.prisma.enrollment.create({
          data: {
            studentId: BigInt(sp.studentId),
            offeringId: offering.id,
            status: 'enrolled'
          }
        });

        enrolled.push({
          studentId: sp.studentId.toString(),
          name: `${sp.studentFirstName} ${sp.studentLastName}`,
          priority: sp.priority,
          reason: sp.reason
        });

      } catch (error: any) {
        console.error(`Error enrolling student ${sp.studentId}:`, error);
        errors.push(`Error enrolling ${sp.studentFirstName}: ${error.message}`);
      }
    }

    return {
      success: true,
      enrolled: enrolled.length,
      remaining: courseAnalysis.totalDemand - enrolled.length,
      students: enrolled,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * 🎯 Agregar curso a sesión activa del programa
   */
  async addCourseToActiveSession(
    courseId: number,
    programId: number,
    createNewGroup: boolean = false
  ): Promise<any> {
    // 1. Buscar sesión activa del programa
    const activeSession = await this.prisma.session.findFirst({
      where: {
        programId: programId,
        endDate: {
          gte: new Date()
        }
      },
      include: {
        offerings: {
          where: { courseId: courseId }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    if (!activeSession) {
      return {
        success: false,
        message: 'No active session found for this program. Please create a session first.'
      };
    }

    // 2. Obtener análisis del curso
    const allAnalyses = await this.analyzeDemandForAllCourses();
    const courseAnalysis = allAnalyses.find(a => a.courseId === courseId);

    if (!courseAnalysis) {
      return {
        success: false,
        message: 'No eligible students found for this course'
      };
    }

    // 3. Si createNewGroup es true, SIEMPRE crear un nuevo grupo
    if (createNewGroup) {
      // Contar cuántos grupos ya existen
      const existingGroupsCount = activeSession.offerings.length;

      const course = await this.prisma.course.findUnique({
        where: { id: courseId }
      });

      if (!course) {
        return {
          success: false,
          message: 'Course not found'
        };
      }

      // Crear nuevo CourseOffering (Grupo adicional)
      const newOffering = await this.prisma.courseOffering.create({
        data: {
          courseId: courseId,
          sessionId: activeSession.id,
          maxStudents: 50
        }
      });

      return {
        success: true,
        message: `Group ${existingGroupsCount + 1} created for ${course.courseCode} in ${activeSession.sessionName}`,
        sessionId: activeSession.id,
        offeringId: newOffering.id,
        groupNumber: existingGroupsCount + 1,
        eligibleStudents: courseAnalysis.totalDemand,
        groupsNeeded: courseAnalysis.groupsNeeded
      };
    }

    // 4. Verificar si el curso ya existe en la sesión
    const existingOffering = activeSession.offerings.find(o => o.courseId === courseId);

    if (existingOffering) {
      return {
        success: false,
        message: 'Course already exists in this session. Use "Create Group 2" option.',
        sessionId: activeSession.id,
        offeringId: existingOffering.id
      };
    }

    // 5. Crear nuevo CourseOffering si no existe (Grupo 1)
    const course = await this.prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return {
        success: false,
        message: 'Course not found'
      };
    }

    const newOffering = await this.prisma.courseOffering.create({
      data: {
        courseId: courseId,
        sessionId: activeSession.id,
        maxStudents: 50
      }
    });

    return {
      success: true,
      message: `Course added to ${activeSession.sessionName}`,
      sessionId: activeSession.id,
      offeringId: newOffering.id,
      eligibleStudents: courseAnalysis.totalDemand,
      groupsNeeded: courseAnalysis.groupsNeeded
    };
  }

}