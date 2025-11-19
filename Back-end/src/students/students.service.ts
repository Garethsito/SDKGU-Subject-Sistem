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
      const totalEnrolled = s.offerings.reduce((sum, offering) => 
        sum + offering._count.enrollments, 0
      );

      const totalCapacity = s.offerings.reduce((sum, offering) => 
        sum + (offering.maxStudents || 30), 0
      );

      const occupancy = totalCapacity > 0 
        ? Math.round((totalEnrolled / totalCapacity) * 100) 
        : 0;

      const firstTeacher = s.offerings[0]?.teacher;
      const professorName = firstTeacher 
        ? `${firstTeacher.firstName} ${firstTeacher.lastName}`
        : 'N/A';

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

  async calculateEnrollmentGrowth() {
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

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
      return 0;
    }

    const growthRate = ((currentYearEnrollments - lastYearEnrollments) / lastYearEnrollments) * 100;
    
    return Math.round(growthRate * 10) / 10;
  }

  async getMissingSubjectsByStudent() {
    try {
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

      const totalStudents = await this.prisma.student.count({
        where: { status: 'active' }
      });

      console.log(`👥 Total active students: ${totalStudents}`);

      if (totalStudents === 0 || allCourses.length === 0) {
        console.log('⚠️ No students or courses found');
        return { labels: [], data: [] };
      }

      const missingData = await Promise.all(
        allCourses.map(async (course) => {
          const programIds = course.programCourses.map(pc => pc.programId);
          
          const studentsWithCourse = await this.prisma.student.count({
            where: {
              status: 'active',
              programId: {
                in: programIds
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
        }
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });

    return students.map(student => {
      // ✅ MEJORADO: Calcular unidades completadas (solo passed/completed, NO transferred)
      const completedRecords = student.records.filter(r => 
        ['passed', 'completed', 'P'].includes(r.status || '')
      );
      
      const unitsEarned = completedRecords.reduce((sum, record) => {
        const course = record.course;
        return sum + (course.credits || 3);
      }, 0) + student.transferredUnits;

      // ✅ MEJORADO: Construir objeto de calificaciones con mejor lógica
      const grades = {};
      
      // 1. Primero procesar records académicos
      student.records.forEach(record => {
        const courseId = record.courseId;
        const grade = record.grade || '-';
        const status = record.status || 'not_started';
        
        // ✅ Determinar el status correcto
        let displayStatus = 'Not Started';
        
        if (grade === 'T' || status === 'transferred') {
          displayStatus = 'Transferred';
        } else if (['passed', 'completed', 'P'].includes(status)) {
          displayStatus = 'Completed';
        } else if (status === 'failed' || grade === 'F') {
          displayStatus = 'Failed';
        } else if (status === 'enrolled') {
          displayStatus = 'In Progress';
        }
        
        grades[courseId] = {
          grade: this.convertGradeToNumeric(grade),
          letter: grade,
          status: displayStatus
        };
      });
      
      // 2. Luego procesar enrollments (In Progress)
      student.enrollments.forEach(enrollment => {
        const courseId = enrollment.offering.courseId;
        
        // Solo marcar como In Progress si no hay record previo
        if (!grades[courseId]) {
          grades[courseId] = {
            grade: null,
            letter: '-',
            status: 'In Progress'
          };
        }
      });
      
      // 3. Finalmente procesar transfers
      student.transfers.forEach(transfer => {
        const courseId = transfer.courseId;
        
        // Marcar como Transferred solo si no hay record
        if (!grades[courseId]) {
          grades[courseId] = {
            grade: null,
            letter: 'T',
            status: 'Transferred'
          };
        }
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
        grades: grades
      };
    });
  }

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
    
    // Process records
    student.records.forEach(record => {
      const courseId = record.courseId;
      const grade = record.grade || '-';
      const status = record.status || 'not_started';
      
      let displayStatus = 'Not Started';
      
      if (grade === 'T' || status === 'transferred') {
        displayStatus = 'Transferred';
      } else if (['passed', 'completed', 'P'].includes(status)) {
        displayStatus = 'Completed';
      } else if (status === 'failed' || grade === 'F') {
        displayStatus = 'Failed';
      } else if (status === 'enrolled') {
        displayStatus = 'In Progress';
      }
      
      grades[courseId] = {
        grade: this.convertGradeToNumeric(grade),
        letter: grade,
        status: displayStatus
      };
    });
    
    // Process enrollments
    student.enrollments.forEach(enrollment => {
      const courseId = enrollment.offering.courseId;
      if (!grades[courseId]) {
        grades[courseId] = {
          grade: null,
          letter: '-',
          status: 'In Progress'
        };
      }
    });
    
    // Process transfers
    student.transfers.forEach(transfer => {
      const courseId = transfer.courseId;
      if (!grades[courseId]) {
        grades[courseId] = {
          grade: null,
          letter: 'T',
          status: 'Transferred'
        };
      }
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

  // ✅ MEJORADO: Función que NO considera "T" como calificación numérica
  private convertGradeToNumeric(grade: string | null): number | null {
    if (!grade) return null;
    
    // ✅ Si es "T" (transferred), retornar null para que no cuente en GPA
    if (grade === 'T') return null;
    
    const gradeMap: { [key: string]: number } = {
      'A+': 97, 'A': 95, 'A-': 92,
      'B+': 88, 'B': 85, 'B-': 82,
      'C+': 78, 'C': 75, 'C-': 72,
      'D+': 68, 'D': 65, 'D-': 62,
      'F': 50, 'P': 85
    };
    
    return gradeMap[grade] || null;
  }

  // ✅ ELIMINADO: Ya no usamos esta función
  // private getRecordStatus(status: string | null): string { ... }

  // ✅ NUEVO: Método para actualizar el status de un estudiante
  async updateStudentStatus(studentId: bigint, newStatus: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    const updatedStudent = await this.prisma.student.update({
      where: { id: studentId },
      data: { status: newStatus }
    });

    return {
      id: Number(updatedStudent.id),
      status: updatedStudent.status
    };
  }
}