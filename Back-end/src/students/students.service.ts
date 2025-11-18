// Back-end/src/students/students.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';

// Interfaz exportada para las calificaciones
export interface GradeInfo {
  grade: number | null;
  letter: string;
  status: string;
  courseCode: string;
  courseName: string;
  sessionName: string;
}

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

  // Obtener todos los estudiantes con TODOS sus datos
  async getAllStudents() {
    console.log('🔍 Fetching all students with complete data...');
    
    const students = await this.prisma.student.findMany({
      where: { status: 'active' },
      include: {
        program: true,
        enrollments: {
          include: {
            offering: {
              include: {
                course: {
                  select: {
                    id: true,
                    courseCode: true,
                    courseName: true,
                    credits: true
                  }
                },
                session: {
                  select: {
                    sessionName: true,
                    startDate: true,
                    endDate: true
                  }
                }
              }
            }
          }
        },
        records: {
          include: {
            course: {
              select: {
                id: true,
                courseCode: true,
                courseName: true,
                credits: true
              }
            },
            session: {
              select: {
                sessionName: true
              }
            }
          }
        },
        transfers: {
          include: {
            course: {
              select: {
                id: true,
                courseCode: true,
                courseName: true,
                credits: true
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

    console.log(`📊 Processing ${students.length} students...`);

    return students.map(student => {
      // Calcular unidades completadas REALES
      const completedRecords = student.records.filter(r => 
        ['passed', 'completed', 'P'].includes(r.status || '')
      );
      
      const unitsEarned = completedRecords.reduce((sum, record) => {
        return sum + (record.course.credits || 3);
      }, 0);

      const totalUnitsEarned = unitsEarned + (student.transferredUnits || 0);

      // Construir objeto de calificaciones DETALLADO
      const grades: Record<number, GradeInfo> = {};
      
      // Incluir calificaciones de academic records
      student.records.forEach(record => {
        grades[record.courseId] = {
          grade: this.convertGradeToNumeric(record.grade),
          letter: record.grade || '-',
          status: this.getRecordStatus(record.status),
          courseCode: record.course.courseCode,
          courseName: record.course.courseName,
          sessionName: record.session?.sessionName || 'N/A'
        };
      });

      // Incluir cursos en progreso (enrollments activos)
      student.enrollments.forEach(enrollment => {
        const courseId = enrollment.offering.course.id;
        const sessionEndDate = enrollment.offering.session.endDate;
        
        // Solo incluir si la sesión aún no termina y no hay record
        if (sessionEndDate > new Date() && !grades[courseId]) {
          grades[courseId] = {
            grade: null,
            letter: '-',
            status: 'In Progress',
            courseCode: enrollment.offering.course.courseCode,
            courseName: enrollment.offering.course.courseName,
            sessionName: enrollment.offering.session.sessionName
          };
        }
      });

      // Incluir transfers
      student.transfers.forEach(transfer => {
        const courseId = transfer.courseId;
        if (!grades[courseId]) {
          grades[courseId] = {
            grade: null, // Las transferidas no deben tener calificación numérica
            letter: 'T', // O 'TR' o 'P', lo que prefieras
            status: 'Transferred', // <-- ¡CORREGIDO!
            courseCode: transfer.course.courseCode,
            courseName: transfer.course.courseName,
            sessionName: 'Transfer'
          };
        }
      });

      // Calcular GPA basado en calificaciones numéricas reales
      let gpa = 0;
      const gradeValues = Object.values(grades) as GradeInfo[];
      const numericGrades = gradeValues
        .map(g => g.grade)
        .filter((g): g is number => g !== null && g > 0);
      
      if (numericGrades.length > 0) {
        const sum = numericGrades.reduce((a, b) => a + b, 0);
        const avg = sum / numericGrades.length;
        gpa = this.numericToGPA(avg);
      }

      const letterGrade = gpa > 0 ? this.numericGradeToLetter(gpa * 25) : 'N/A';

      // Formatear fechas
      const formatDate = (date: Date | null) => {
        if (!date) return 'N/A';
        return date.toISOString().split('T')[0];
      };

      console.log(`  ✓ ${student.firstName} ${student.lastName} - GPA: ${gpa.toFixed(2)} (${letterGrade}), Units: ${totalUnitsEarned}/${student.totalUnits}`);

      return {
        id: Number(student.id),
        studentId: student.studentIdNumber || `STU-${student.id.toString().padStart(6, '0')}`,
        name: `${student.firstName} ${student.lastName}`,
        firstName: student.firstName,
        middleName: student.middleName || '',
        lastName: student.lastName,
        phone: student.phone || 'N/A',
        emailPersonal: student.email || 'N/A',
        emailSDGKU: student.sdgkuEmail || `${student.firstName.toLowerCase()}.${student.lastName.toLowerCase()}@sdgku.edu`,
        status: this.capitalizeStatus(student.status),
        program: student.program?.programName || 'Unknown',
        modality: student.modality || 'Online',
        cohort: `${this.getSeasonFromDate(student.startDate)} ${student.enrollmentYear}`,
        language: student.language || 'English',
        totalUnits: student.totalUnits || 0,
        transferredUnits: student.transferredUnits || 0,
        unitsEarned: totalUnitsEarned,
        startDate: formatDate(student.startDate),
        scheduledCompletion: formatDate(student.scheduledCompletionDate),
        graduationDate: formatDate(student.graduationDate),
        grades: grades,
        gpa: parseFloat(gpa.toFixed(2)),
        letterGrade: letterGrade
      };
    });
  }

  // FUNCIÓN ACTUALIZADA - Obtener un estudiante por ID con TODOS sus datos
  async getStudentById(studentId: bigint) {
    console.log(`🔍 Fetching student ${studentId}...`);
    
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        program: true,
        enrollments: {
          include: {
            offering: {
              include: {
                course: {
                  select: {
                    id: true,
                    courseCode: true,
                    courseName: true,
                    credits: true
                  }
                },
                session: {
                  select: {
                    sessionName: true,
                    startDate: true,
                    endDate: true
                  }
                }
              }
            }
          }
        },
        records: {
          include: {
            course: {
              select: {
                id: true,
                courseCode: true,
                courseName: true,
                credits: true
              }
            },
            session: {
              select: {
                sessionName: true
              }
            }
          }
        },
        transfers: {
          include: {
            course: {
              select: {
                id: true,
                courseCode: true,
                courseName: true,
                credits: true
              }
            }
          }
        }
      }
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    // Misma lógica que getAllStudents pero para un solo estudiante
    const completedRecords = student.records.filter(r => 
      ['passed', 'completed', 'P'].includes(r.status || '')
    );
    
    const unitsEarned = completedRecords.reduce((sum, record) => {
      return sum + (record.course.credits || 3);
    }, 0);

    const totalUnitsEarned = unitsEarned + (student.transferredUnits || 0);

    const grades: Record<number, GradeInfo> = {};
    
    student.records.forEach(record => {
      grades[record.courseId] = {
        grade: this.convertGradeToNumeric(record.grade),
        letter: record.grade || '-',
        status: this.getRecordStatus(record.status),
        courseCode: record.course.courseCode,
        courseName: record.course.courseName,
        sessionName: record.session?.sessionName || 'N/A'
      };
    });

    student.enrollments.forEach(enrollment => {
      const courseId = enrollment.offering.course.id;
      const sessionEndDate = enrollment.offering.session.endDate;
      
      if (sessionEndDate > new Date() && !grades[courseId]) {
        grades[courseId] = {
          grade: null,
          letter: '-',
          status: 'In Progress',
          courseCode: enrollment.offering.course.courseCode,
          courseName: enrollment.offering.course.courseName,
          sessionName: enrollment.offering.session.sessionName
        };
      }
    });

    student.transfers.forEach(transfer => {
      const courseId = transfer.courseId;
      if (!grades[courseId]) {
        grades[courseId] = {
          grade: null, 
          letter: 'T',
          status: 'Transferred', // <-- ¡CORREGIDO!
          courseCode: transfer.course.courseCode,
          courseName: transfer.course.courseName,
          sessionName: 'Transfer'
        };
      }
    });

    let gpa = 0;
    const gradeValues = Object.values(grades) as GradeInfo[];
    const numericGrades = gradeValues
      .map(g => g.grade)
      .filter((g): g is number => g !== null && g > 0);
    
    if (numericGrades.length > 0) {
      const sum = numericGrades.reduce((a, b) => a + b, 0);
      const avg = sum / numericGrades.length;
      gpa = this.numericToGPA(avg);
    }

    const letterGrade = gpa > 0 ? this.numericGradeToLetter(gpa * 25) : 'N/A';

    const formatDate = (date: Date | null) => {
      if (!date) return 'N/A';
      return date.toISOString().split('T')[0];
    };

    return {
      id: Number(student.id),
      studentId: student.studentIdNumber || `STU-${student.id.toString().padStart(6, '0')}`,
      name: `${student.firstName} ${student.lastName}`,
      firstName: student.firstName,
      middleName: student.middleName || '',
      lastName: student.lastName,
      phone: student.phone || 'N/A',
      emailPersonal: student.email || 'N/A',
      emailSDGKU: student.sdgkuEmail || `${student.firstName.toLowerCase()}.${student.lastName.toLowerCase()}@sdgku.edu`,
      status: this.capitalizeStatus(student.status),
      program: student.program?.programName || 'Unknown',
      modality: student.modality || 'Online',
      cohort: `${this.getSeasonFromDate(student.startDate)} ${student.enrollmentYear}`,
      language: student.language || 'English',
      totalUnits: student.totalUnits || 0,
      transferredUnits: student.transferredUnits || 0,
      unitsEarned: totalUnitsEarned,
      startDate: formatDate(student.startDate),
      scheduledCompletion: formatDate(student.scheduledCompletionDate),
      graduationDate: formatDate(student.graduationDate),
      grades: grades,
      gpa: parseFloat(gpa.toFixed(2)),
      letterGrade: letterGrade
    };
  }

  // Helper functions
  private convertGradeToNumeric(grade: string | null): number | null {
    if (!grade) return null;
    
    const gradeMap: { [key: string]: number } = {
      'A+': 98, 'A': 95, 'A-': 92,
      'B+': 88, 'B': 85, 'B-': 82,
      'C+': 78, 'C': 75, 'C-': 72,
      'D+': 68, 'D': 65, 'D-': 62,
      'F': 50, 'P': 85
    };
    
    return gradeMap[grade] || null;
  }

  private numericToGPA(numeric: number): number {
    if (numeric >= 93) return 4.0;
    if (numeric >= 90) return 3.7;
    if (numeric >= 87) return 3.3;
    if (numeric >= 83) return 3.0;
    if (numeric >= 80) return 2.7;
    if (numeric >= 77) return 2.3;
    if (numeric >= 73) return 2.0;
    if (numeric >= 70) return 1.7;
    if (numeric >= 67) return 1.3;
    if (numeric >= 60) return 1.0;
    return 0.0;
  }

  private numericGradeToLetter(numeric: number): string {
    if (numeric >= 97) return 'A+';
    if (numeric >= 93) return 'A';
    if (numeric >= 90) return 'A-';
    if (numeric >= 87) return 'B+';
    if (numeric >= 83) return 'B';
    if (numeric >= 80) return 'B-';
    if (numeric >= 77) return 'C+';
    if (numeric >= 73) return 'C';
    if (numeric >= 70) return 'C-';
    if (numeric >= 67) return 'D+';
    if (numeric >= 60) return 'D';
    return 'F';
  }

  private getRecordStatus(status: string | null): string {
      if (!status) return 'Not Started';
      
      // Normalizar el status a minúsculas por si acaso
      const s = status.toLowerCase();

      if (['passed', 'completed', 'p'].includes(s)) return 'Completed';
      if (s === 'enrolled') return 'In Progress';
      if (['failed', 'f'].includes(s)) return 'Failed';
      
      // --- LÍNEA NUEVA ---
      if (s === 'transferred') return 'Transferred';
      // --- Fin de la corrección ---

      return 'Not Started';
  }

  private capitalizeStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'Active',
      'on_leave': 'On Leave',
      'inactive': 'Inactive'
    };
    return statusMap[status] || 'Active';
  }

  private getSeasonFromDate(date: Date): string {
    const month = date.getMonth();
    if (month >= 0 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    return 'Fall';
  }

  // NUEVO: Actualizar el estado de un estudiante
  async updateStudentStatus(studentId: bigint, status: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    const updatedStudent = await this.prisma.student.update({
      where: { id: studentId },
      data: { status: status }
    });

    console.log(`✅ Updated student ${studentId} status to: ${status}`);

    return {
      id: Number(updatedStudent.id),
      studentId: updatedStudent.studentIdNumber,
      status: this.capitalizeStatus(updatedStudent.status)
    };
  }
}