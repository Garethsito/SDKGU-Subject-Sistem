// Back-end/src/students/students.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
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

  async getMissingSubjectsByStudent() {
    try {
      // 1. Obtener todos los cursos del sistema con sus programas
      const allCourses = await this.prisma.course.findMany({
        include: {
          programCourses: {
            include: {
              program: true
            }
          }
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
          // Obtener todos los programIds relacionados con este curso
          const programIds = course.programCourses.map(pc => pc.programId);
          
          // Contar estudiantes activos de TODOS los programas relacionados que YA tomaron el curso
          const studentsWithCourse = await this.prisma.student.count({
            where: {
              status: 'active',
              programId: {
                in: programIds // Buscar en todos los programas
              },
              OR: [
                {
                  enrollments: {
                    some: {
                      offering: {
                        courseId: course.id
                      }
                    }
                  }
                },
                {
                  records: {
                    some: {
                      courseId: course.id
                    }
                  }
                },
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

          // Total de estudiantes de TODOS los programas relacionados
          const programStudents = await this.prisma.student.count({
            where: {
              status: 'active',
              programId: {
                in: programIds
              }
            }
          });

          const missingCount = programStudents - studentsWithCourse;

          return {
            label: course.courseCode,
            courseName: course.courseName,
            missing: missingCount > 0 ? missingCount : 0,
            programIds: programIds
          };
        })
      );

      // console.log('📊 Missing data calculated:', missingData);

      // 4. Filtrar solo cursos con estudiantes faltantes y ordenar
      const topMissing = missingData
        .filter(item => item.missing > 0)
        .sort((a, b) => b.missing - a.missing)
        .slice(0, 6);

      console.log('🔍 Top 6 missing courses:', topMissing);

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

  // Obtener todos los estudiantes con detalles
  // students.service.ts - Función getAllStudents()

async getAllStudents() {
  const students = await this.prisma.student.findMany({
    where: { status: 'active' },
    include: {
      program: true,
      enrollments: {
        include: {
          offering: {
            include: {
              course: true,
              session: true
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
    orderBy: [
      { lastName: 'asc' },
      { firstName: 'asc' }
    ]
  });

  return students.map(student => {
    const completedRecords = student.records.filter(r => 
      ['passed', 'completed', 'P', 'completado'].includes(r.status || '')  // 🔥 AGREGAR 'completado'
    );
    
    const unitsEarned = completedRecords.reduce((sum, record) => {
      const course = record.course;
      return sum + (course.credits || 3);
    }, 0) + student.transferredUnits;

    const completedCourseIds = [
      ...completedRecords.map(r => r.courseId),
      ...student.transfers.map(t => t.courseId)
    ];

    const programCourses = student.program ? [] : [];

    // 🎯 CONSTRUIR GRADES CON EL STATUS CORRECTO
    const grades = {};
    student.records.forEach(record => {
      grades[record.courseId] = {
        grade: this.convertGradeToNumeric(record.grade),
        letter: record.grade || '-',
        status: this.mapStatus(record.status)  // 🔥 USAR NUEVA FUNCIÓN
      };
    });

    return {
      id: Number(student.id),
      studentId: student.studentIdNumber,
      name: `${student.firstName} ${student.lastName}`,
      firstName: student.firstName,
      middleName: student.middleName || '',
      lastName: student.lastName,
      phone: student.phone || 'N/A',
      emailPersonal: student.email || 'N/A',
      emailSDGKU: student.sdgkuEmail || 'N/A',
      status: student.status === 'active' ? 'Active' : 'Inactive',
      program: student.program?.programName || 'Unknown',
      modality: student.modality || 'Online',
      cohort: `Fall ${student.enrollmentYear}`,
      language: student.language || 'English',
      totalUnits: student.totalUnits,
      transferredUnits: student.transferredUnits,
      unitsEarned: unitsEarned,
      startDate: student.startDate.toISOString().split('T')[0],
      scheduledCompletion: student.scheduledCompletionDate 
        ? student.scheduledCompletionDate.toISOString().split('T')[0] 
        : 'TBD',
      graduationDate: student.graduationDate 
        ? student.graduationDate.toISOString().split('T')[0] 
        : 'TBD',
      completedSubjects: completedCourseIds,
      requiredSubjects: programCourses,
      grades: grades,
      progress: {}
    };
  });
}

// 🆕 NUEVA FUNCIÓN PARA MAPEAR STATUS
private mapStatus(status: string | null): string {
  if (!status) return 'Not Started';
  
  const statusLower = status.toLowerCase();
  
  // Mapear desde la BD al frontend
  if (statusLower === 'completado') return 'Completed';
  if (statusLower === 'pendiente') return 'In Progress';
  if (statusLower === 'reprobado') return 'Failed';
  if (statusLower === 'completed') return 'Completed';
  if (statusLower === 'in progress') return 'In Progress';
  if (statusLower === 'failed') return 'Failed';
  
  return 'Not Started';
}


  // Obtener un estudiante por ID
  async getStudentById(studentId: bigint) {
  const student = await this.prisma.student.findUnique({
    where: { id: studentId },
    include: {
      program: true,
      enrollments: {
        include: {
          offering: {
            include: {
              course: true,
              session: true
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
    }
  });

  if (!student) {
    throw new NotFoundException(`Student with ID ${studentId} not found`);
  }

  const completedRecords = student.records.filter(r => 
    ['passed', 'completed', 'P', 'completado'].includes(r.status || '')  // 🔥 AGREGAR 'completado'
  );
  
  const unitsEarned = completedRecords.reduce((sum, record) => {
    return sum + (record.course.credits || 3);
  }, 0) + student.transferredUnits;

  const grades = {};
  student.records.forEach(record => {
    grades[record.courseId] = {
      grade: this.convertGradeToNumeric(record.grade),
      letter: record.grade || '-',
      status: this.mapStatus(record.status)  // 🔥 USAR mapStatus
    };
  });

  return {
    id: Number(student.id),
    studentId: student.studentIdNumber,
    name: `${student.firstName} ${student.lastName}`,
    firstName: student.firstName,
    middleName: student.middleName || '',
    lastName: student.lastName,
    phone: student.phone || 'N/A',
    emailPersonal: student.email || 'N/A',
    emailSDGKU: student.sdgkuEmail || 'N/A',
    status: student.status === 'active' ? 'Active' : 'Inactive',
    program: student.program?.programName || 'Unknown',
    modality: student.modality || 'Online',
    cohort: `Fall ${student.enrollmentYear}`,
    language: student.language || 'English',
    totalUnits: student.totalUnits,
    transferredUnits: student.transferredUnits,
    unitsEarned: unitsEarned,
    startDate: student.startDate.toISOString().split('T')[0],
    scheduledCompletion: student.scheduledCompletionDate?.toISOString().split('T')[0] || 'TBD',
    graduationDate: student.graduationDate?.toISOString().split('T')[0] || 'TBD',
    grades: grades
  };
}

  // Helpers
  private convertGradeToNumeric(grade: string | null): number | null {
    if (!grade) return null;
    
    const gradeMap: { [key: string]: number } = {
      'A': 95, 'A-': 92,
      'B+': 88, 'B': 85, 'B-': 82,
      'C+': 78, 'C': 75, 'C-': 72,
      'D+': 68, 'D': 65, 'D-': 62,
      'F': 50, 'P': 85
    };
    
    return gradeMap[grade] || null;
  }

  private getRecordStatus(status: string | null): string {
    if (!status) return 'Not Started';
    if (['passed', 'completed', 'P'].includes(status)) return 'Completed';
    if (status === 'enrolled') return 'In Progress';
    return 'Not Started';
  }

}