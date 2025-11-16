// Back-end/src/students/students.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async countStudents(): Promise<number> {
    const total = await this.prisma.student.count();
    return total;
  }

  async getDistribution() {
    const programCounts = await this.prisma.student.groupBy({
      by: ['programId'],
      _count: { programId: true },
    });

    const programNames: Record<number, string> = {
      1: 'BSGM',
      2: 'ASSD',
    };

    const labels = programCounts.map(p => programNames[p.programId] || `Programa ${p.programId}`);
    const data = programCounts.map(p => p._count.programId);

    return {
      studentDistribution: {
        labels,
        data,
      },
    };
  }

  async countSessions() {
    return await this.prisma.session.count();
  }

  // 🆕 Obtener todas las sesiones con datos reales
  async getAllSessions() {
    const sessions = await this.prisma.session.findMany({
      include: {
        program: { select: { programName: true } },
        offerings: {
          include: {
            course: { select: { courseName: true, courseCode: true } },
            teacher: { select: { firstName: true, lastName: true } },
            _count: { select: { enrollments: true } }
          }
        }
      },
      orderBy: { startDate: 'asc' },
    });

    return sessions.map(s => {
      // Calcular estudiantes totales en la sesión
      const totalEnrolled = s.offerings.reduce((sum, offering) => 
        sum + offering._count.enrollments, 0
      );

      // Calcular capacidad máxima de la sesión
      const totalCapacity = s.offerings.reduce((sum, offering) => 
        sum + (offering.maxStudents || 30), 0
      );

      const occupancy = totalCapacity > 0 
        ? Math.round((totalEnrolled / totalCapacity) * 100) 
        : 0;

      // Obtener profesor (del primer offering)
      const firstTeacher = s.offerings[0]?.teacher;
      const professorName = firstTeacher 
        ? `${firstTeacher.firstName} ${firstTeacher.lastName}`
        : 'N/A';

      // Obtener materias únicas
      const subjects = [...new Set(s.offerings.map(o => o.course.courseCode))];

      return {
        id: s.id,
        name: s.sessionName,
        program: s.program?.programName || 'N/A',
        month: s.startDate.toLocaleString('en-US', { 
          month: 'long', 
          year: 'numeric', 
          timeZone: 'UTC' 
        }),
        occupancy: occupancy,
        status: new Date(s.endDate) > new Date() ? 'active' : 'ended',
        lowEnrollment: occupancy < 40,
        subjects: subjects,
        professor: professorName,
      };
    });
  }

  // 🆕 Calcular crecimiento de matrícula REAL (año actual vs año anterior)
  async calculateEnrollmentGrowth() {
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    // Estudiantes inscritos este año
    const currentYearEnrollments = await this.prisma.enrollment.count({
      where: {
        offering: {
          session: {
            startDate: {
              gte: new Date(`${currentYear}-01-01`),
              lte: new Date(`${currentYear}-12-31`)
            }
          }
        }
      }
    });

    // Estudiantes inscritos el año pasado
    const lastYearEnrollments = await this.prisma.enrollment.count({
      where: {
        offering: {
          session: {
            startDate: {
              gte: new Date(`${lastYear}-01-01`),
              lte: new Date(`${lastYear}-12-31`)
            }
          }
        }
      }
    });

    if (lastYearEnrollments === 0) {
      // Si no hay datos del año anterior, retornar 0
      return 0;
    }

    // Calcular crecimiento porcentual
    const growthRate = ((currentYearEnrollments - lastYearEnrollments) / lastYearEnrollments) * 100;
    
    return Math.round(growthRate * 10) / 10;
  }

  // 🆕 Obtener materias con más estudiantes faltantes

  async getMissingSubjectsByStudent() {
    try {
      // 1. Obtener todos los cursos ACTIVOS del sistema
      const allCourses = await this.prisma.course.findMany({
        select: {
          id: true,
          courseName: true,
          courseCode: true,
          programId: true,
        }
      });

      console.log(`📚 Total courses in system: ${allCourses.length}`);

      // 2. Obtener total de estudiantes activos
      const totalStudents = await this.prisma.student.count({
        where: { status: 'active' }
      });

      console.log(`👥 Total active students: ${totalStudents}`);

      if (totalStudents === 0 || allCourses.length === 0) {
        console.log('⚠️ No students or courses found');
        return { labels: [], data: [] };
      }

      // 3. Para cada curso, calcular cuántos estudiantes NO lo han tomado
      const missingData = await Promise.all(
        allCourses.map(async (course) => {
          // Contar estudiantes activos del mismo programa que YA tomaron el curso
          const studentsWithCourse = await this.prisma.student.count({
            where: {
              status: 'active',
              programId: course.programId, // Solo del mismo programa
              OR: [
                // Tienen un enrollment activo o pasado
                {
                  enrollments: {
                    some: {
                      offering: {
                        courseId: course.id
                      }
                    }
                  }
                },
                // Tienen un academic record (ya lo pasaron)
                {
                  records: {
                    some: {
                      courseId: course.id
                    }
                  }
                },
                // Tienen un transfer credit
                {
                  transfers: {
                    some: {
                      courseId: course.id
                    }
                  }
                }
              ]
            }
          });

          // Total de estudiantes del programa
          const programStudents = await this.prisma.student.count({
            where: {
              status: 'active',
              programId: course.programId
            }
          });

          // Estudiantes faltantes = estudiantes del programa - los que ya lo tomaron
          const missingCount = programStudents - studentsWithCourse;

          return {
            label: course.courseCode,
            courseName: course.courseName,
            missing: missingCount > 0 ? missingCount : 0,
            programId: course.programId
          };
        })
      );

      console.log('📊 Missing data calculated:', missingData);

      // 4. Filtrar solo cursos con estudiantes faltantes y ordenar
      const topMissing = missingData
        .filter(item => item.missing > 0)
        .sort((a, b) => b.missing - a.missing)
        .slice(0, 6); // Top 6

      console.log('🔝 Top 6 missing courses:', topMissing);

      if (topMissing.length === 0) {
        console.log('✅ All students have taken all courses!');
        return { labels: [], data: [] };
      }

      return {
        labels: topMissing.map(item => item.label),
        data: topMissing.map(item => item.missing)
      };

    } catch (error) {
      console.error('❌ Error calculating missing subjects:', error);
      return { labels: [], data: [] };
    }
  }
}