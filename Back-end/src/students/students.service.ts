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
        program: true, // ✅ Ya está incluido
        records: {
          include: {
            course: true,
            session: true // ✅ Agregado para tener sessionName
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

    console.log(`📊 Processing ${students.length} students...`);

    return students.map(student => {
      const completedRecords = student.records.filter(r => 
        ['passed', 'completed', 'transferred', 'completado'].includes(r.status?.toLowerCase() || '')
      );
      
      const unitsEarned = completedRecords.reduce((sum, record) => {
        const course = record.course;
        return sum + (course.credits || 3);
      }, 0) + student.transferredUnits;

      // ✅ CORREGIDO: Procesar grades correctamente
      const grades = {};
      student.records.forEach(record => {
        const numericGrade = this.convertGradeToNumeric(record.grade);
        
        grades[record.courseId] = {
          grade: numericGrade, // Numérico para cálculos
          letter: record.grade || '-', // Letra original
          status: this.mapStatus(record.status), // Status mapeado
          courseCode: record.course.courseCode,
          courseName: record.course.courseName,
          sessionName: record.session?.sessionName || 'N/A'
        };
      });

      // 🔍 DEBUG: Ver primer estudiante
      if (student.id === students[0]?.id) {
        console.log('📋 Sample student grades:', {
          studentId: student.studentIdNumber,
          totalRecords: student.records.length,
          sampleGrade: grades[Object.keys(grades)[0]]
        });
      }

      return {
        id: Number(student.id),
        studentIdNumber: student.studentIdNumber,
        name: `${student.firstName} ${student.lastName}`,
        firstName: student.firstName,
        middleName: student.middleName || '',
        lastName: student.lastName,
        phone: student.phone || 'N/A',
        email: student.email || 'N/A',
        sdgkuEmail: student.sdgkuEmail || 'N/A',
        status: student.status === 'active' ? 'Active' : 'Inactive',
        program: student.program, // ✅ Enviar objeto completo con programName
        modality: student.modality || 'Online',
        cohort: student.cohort || `Fall ${student.enrollmentYear}`,
        language: student.language || 'English',
        totalUnits: student.totalUnits,
        transferredUnits: student.transferredUnits,
        totalUnitsEarned: unitsEarned,
        startDate: student.startDate.toISOString().split('T')[0],
        scheduledCompletionDate: student.scheduledCompletionDate 
          ? student.scheduledCompletionDate.toISOString().split('T')[0] 
          : 'TBD',
        graduationDate: student.graduationDate 
          ? student.graduationDate.toISOString().split('T')[0] 
          : 'TBD',
        grades: grades // ✅ Grades con estructura completa
      };
    });
  }

  async getStudentById(studentId: bigint) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        program: true,
        records: {
          include: {
            course: true,
            session: true
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
      ['passed', 'completed', 'transferred', 'completado'].includes(r.status?.toLowerCase() || '')
    );
    
    const unitsEarned = completedRecords.reduce((sum, record) => {
      return sum + (record.course.credits || 3);
    }, 0) + student.transferredUnits;

    const grades = {};
    student.records.forEach(record => {
      const numericGrade = this.convertGradeToNumeric(record.grade);
      
      grades[record.courseId] = {
        grade: numericGrade,
        letter: record.grade || '-',
        status: this.mapStatus(record.status),
        courseCode: record.course.courseCode,
        courseName: record.course.courseName,
        sessionName: record.session?.sessionName || 'N/A'
      };
    });

    return {
      id: Number(student.id),
      studentIdNumber: student.studentIdNumber,
      name: `${student.firstName} ${student.lastName}`,
      firstName: student.firstName,
      middleName: student.middleName || '',
      lastName: student.lastName,
      phone: student.phone || 'N/A',
      email: student.email || 'N/A',
      sdgkuEmail: student.sdgkuEmail || 'N/A',
      status: student.status === 'active' ? 'Active' : 'Inactive',
      program: student.program,
      modality: student.modality || 'Online',
      cohort: student.cohort || `Fall ${student.enrollmentYear}`,
      language: student.language || 'English',
      totalUnits: student.totalUnits,
      transferredUnits: student.transferredUnits,
      totalUnitsEarned: unitsEarned,
      startDate: student.startDate.toISOString().split('T')[0],
      scheduledCompletionDate: student.scheduledCompletionDate?.toISOString().split('T')[0] || 'TBD',
      graduationDate: student.graduationDate?.toISOString().split('T')[0] || 'TBD',
      grades: grades
    };
  }

  // ✅ MEJORADO: Convertir grade a numérico
  private convertGradeToNumeric(grade: string | null): number | null {
    if (!grade) return null;
    
    // Si ya es numérico, retornarlo
    const numeric = parseFloat(grade);
    if (!isNaN(numeric)) return numeric;
    
    // Si es T o P, no tiene valor numérico
    if (grade === 'T' || grade === 'P') return null;
    
    // Mapeo de letras a números
    const gradeMap: { [key: string]: number } = {
      'A+': 97, 'A': 95, 'A-': 92,
      'B+': 88, 'B': 85, 'B-': 82,
      'C+': 78, 'C': 75, 'C-': 72,
      'D+': 68, 'D': 65, 'D-': 62,
      'F': 50
    };
    
    return gradeMap[grade.toUpperCase()] || null;
  }

  // ✅ MEJORADO: Mapear status correctamente
  private mapStatus(status: string | null): string {
    if (!status) return 'Not Started';
    
    const statusLower = status.toLowerCase().trim();
    
    // Transferred
    if (statusLower === 'transferred' || statusLower === 'transferido') {
      return 'Transferred';
    }
    
    // Completed
    if (statusLower === 'completed' || statusLower === 'completado' || 
        statusLower === 'passed' || statusLower === 'aprobado') {
      return 'Completed';
    }
    
    // In Progress
    if (statusLower === 'in progress' || statusLower === 'pendiente' || 
        statusLower === 'pending') {
      return 'In Progress';
    }
    
    // Failed
    if (statusLower === 'failed' || statusLower === 'reprobado' || 
        statusLower === 'fail') {
      return 'Failed';
    }
    
    return 'Not Started';
  }
}