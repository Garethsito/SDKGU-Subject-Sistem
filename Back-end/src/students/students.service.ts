// Back-end/src/students/students.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) { }

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
      console.log('🔍 Starting getMissingSubjectsByStudent...');

      // Obtener todos los cursos con sus programas
      const allCourses = await this.prisma.course.findMany({
        include: {
          programCourses: {
            include: {
              program: true
            }
          }
        },
        orderBy: {
          courseCode: 'asc'
        }
      });

      console.log(`Total courses found: ${allCourses.length}`);

      if (allCourses.length === 0) {
        console.log('No courses found in database');
        return { labels: [], data: [] };
      }

      // Obtener todos los estudiantes activos con sus relaciones
      const allStudents = await this.prisma.student.findMany({
        where: {
          status: 'active'
        },
        include: {
          enrollments: {
            include: {
              offering: {
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
        }
      });

      console.log(`Total active students: ${allStudents.length}`);

      if (allStudents.length === 0) {
        console.log('No active students found');
        return { labels: [], data: [] };
      }

      // Calcular estudiantes faltantes por cada curso
      const missingData = allCourses.map(course => {
        // Obtener los IDs de los programas que incluyen este curso
        const programIds = course.programCourses.map(pc => pc.programId);

        if (programIds.length === 0) {
          return {
            label: course.courseCode,
            courseName: course.courseName,
            missing: 0,
            totalStudents: 0,
            studentsWithCourse: 0
          };
        }

        // Estudiantes del programa que deberían tomar este curso
        const studentsInProgram = allStudents.filter(student =>
          programIds.includes(student.programId)
        );

        // Estudiantes que YA TIENEN el curso (enrollments, records o transfers)
        const studentsWithCourse = studentsInProgram.filter(student => {
          // Verificar enrollments (cursos actuales)
          const hasEnrollment = student.enrollments.some(
            e => e.offering.courseId === course.id
          );

          // Verificar records (cursos completados/en progreso)
          const hasRecord = student.records.some(
            r => r.courseId === course.id
          );

          // Verificar transfers
          const hasTransfer = student.transfers.some(
            t => t.courseId === course.id
          );

          return hasEnrollment || hasRecord || hasTransfer;
        });

        const missingCount = studentsInProgram.length - studentsWithCourse.length;

        return {
          label: course.courseCode,
          courseName: course.courseName,
          missing: missingCount > 0 ? missingCount : 0,
          totalStudents: studentsInProgram.length,
          studentsWithCourse: studentsWithCourse.length
        };
      });

      //console.log('Missing data calculated:', missingData.slice(0, 3));

      // 4️⃣ Filtrar y ordenar: Top 6 cursos con más estudiantes faltantes
      const topMissing = missingData
        .filter(item => item.missing > 0)
        .sort((a, b) => b.missing - a.missing)
        .slice(0, 6);

      //console.log('Top 6 courses with missing students:', topMissing);

      if (topMissing.length === 0) {
        console.log('All students have completed all required courses!');
        return {
          labels: ['No Data'],
          data: [0]
        };
      }

      return {
        labels: topMissing.map(item => item.label),
        data: topMissing.map(item => item.missing)
      };

    } catch (error) {
      console.error('Error in getMissingSubjectsByStudent:', error);
      return {
        labels: [],
        data: []
      };
    }
  }

  async getAllStudents() {
    const students = await this.prisma.student.findMany({
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
            course: true,
            session: true
          }
        },
        transfers: {
          include: {
            course: true
          }
        },
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

    console.log(`Processing ${students.length} students...`);

    return students.map(student => {
      // OBTENER CURSOS DEL PROGRAMA DEL ESTUDIANTE
      const programCourseIds = student.program?.programCourses?.map(pc => pc.courseId) || [];

      // FILTRAR SOLO RECORDS QUE PERTENECEN AL PROGRAMA
      const completedRecords = student.records.filter(r =>
        ['passed', 'completed', 'transferred', 'completado'].includes(r.status?.toLowerCase() || '') &&
        programCourseIds.includes(r.courseId) // ⭐ FILTRO AÑADIDO
      );

      // CALCULAR CRÉDITOS SOLO DE CURSOS DEL PROGRAMA
      const unitsEarned = completedRecords.reduce((sum, record) => {
        const course = record.course;
        return sum + (course.credits || 3);
      }, 0);

      // Process grades
      const grades = {};

      // FIRST: Add enrollments (courses in progress)
      student.enrollments.forEach(enrollment => {
        const courseId = enrollment.offering.courseId;

        grades[courseId] = {
          grade: null,
          letter: 'IP',
          status: 'In Progress',
          courseCode: enrollment.offering.course.courseCode,
          courseName: enrollment.offering.course.courseName,
          sessionName: enrollment.offering.session?.sessionName || 'N/A',
          isEnrolled: true
        };
      });

      // THEN: Process records (overwrites enrollments if completed)
      student.records.forEach(record => {
        const numericGrade = this.convertGradeToNumeric(record.grade);

        grades[record.courseId] = {
          grade: numericGrade,
          letter: record.grade || '-',
          status: this.mapStatus(record.status),
          courseCode: record.course.courseCode,
          courseName: record.course.courseName,
          sessionName: record.session?.sessionName || 'N/A',
          isEnrolled: false
        };
      });

      // DEBUG: Log first student
      if (student.id === students[0]?.id) {
        console.log('Sample student calculation:', {
          studentId: student.studentIdNumber,
          programCourses: programCourseIds.length,
          completedInProgram: completedRecords.length,
          totalRecords: student.records.length,
          unitsEarned: unitsEarned,
          transferredUnits: student.transferredUnits,
          totalUnits: student.totalUnits
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
        program: student.program,
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
        grades: grades
      };
    });
  }

  async getStudentById(studentId: bigint) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
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
            course: true,
            session: true
          }
        },
        transfers: {
          include: {
            course: true
          }
        },
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
      }
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    // OBTENER CURSOS DEL PROGRAMA DEL ESTUDIANTE
    const programCourseIds = student.program?.programCourses?.map(pc => pc.courseId) || [];

    // FILTRAR SOLO RECORDS QUE PERTENECEN AL PROGRAMA
    const completedRecords = student.records.filter(r =>
      ['passed', 'completed', 'transferred', 'completado'].includes(r.status?.toLowerCase() || '') &&
      programCourseIds.includes(r.courseId) // ⭐ FILTRO AÑADIDO
    );

    // CALCULAR CRÉDITOS SOLO DE CURSOS DEL PROGRAMA
    const unitsEarned = completedRecords.reduce((sum, record) => {
      return sum + (record.course.credits || 3);
    }, 0);

    // Procesar grades igual que en getAllStudents
    const grades = {};

    // FIRST: Add enrollments (courses in progress)
    student.enrollments.forEach(enrollment => {
      const courseId = enrollment.offering.courseId;

      grades[courseId] = {
        grade: null,
        letter: 'IP',
        status: 'In Progress',
        courseCode: enrollment.offering.course.courseCode,
        courseName: enrollment.offering.course.courseName,
        sessionName: enrollment.offering.session?.sessionName || 'N/A',
        isEnrolled: true
      };
    });

    // THEN: Process records (overwrites enrollments if completed)
    student.records.forEach(record => {
      const numericGrade = this.convertGradeToNumeric(record.grade);

      grades[record.courseId] = {
        grade: numericGrade,
        letter: record.grade || '-',
        status: this.mapStatus(record.status),
        courseCode: record.course.courseCode,
        courseName: record.course.courseName,
        sessionName: record.session?.sessionName || 'N/A',
        isEnrolled: false
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

  // Convertir grade a numérico
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

  // Mapear status correctamente
  private mapStatus(status: string | null): string {
    if (!status) return 'Not Started';

    const statusLower = status.toLowerCase().trim();
    // Enrolled (curso actual)
    if (statusLower === 'enrolled' || statusLower === 'inscrito') {
      return 'In Progress';
    }

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

  // Back-end/src/students/students.service.ts
// 🆕 Agregar este método al servicio existente

async importStudent(data: any) {
  try {
    // 1️⃣ Buscar o crear el programa
    let program = await this.prisma.program.findUnique({
      where: { programName: data.programName }
    });

    if (!program) {
      // Si el programa no existe, crearlo con valores por defecto
      program = await this.prisma.program.create({
        data: {
          programName: data.programName,
          programType: data.programName === 'BSGM' ? 'Bachelor' : 'Associate',
          totalCourses: data.programName === 'BSGM' ? 40 : 20,
          totalUnits: data.programName === 'BSGM' ? 126 : 60
        }
      });
    }

    // 2️⃣ Verificar si el estudiante ya existe
    const existingStudent = await this.prisma.student.findUnique({
      where: { studentIdNumber: data.studentIdNumber }
    });

    if (existingStudent) {
      // Si existe, actualizar
      return await this.prisma.student.update({
        where: { id: existingStudent.id },
        data: {
          firstName: data.firstName,
          middleName: data.middleName,
          lastName: data.lastName,
          email: data.email,
          sdgkuEmail: data.sdgkuEmail,
          phone: data.phone,
          rgmKey: data.rgmKey,
          programId: program.id,
          modality: data.modality,
          cohort: data.cohort,
          language: data.language,
          status: data.status,
          startDate: data.startDate ? new Date(data.startDate) : new Date(),
          scheduledCompletionDate: data.scheduledCompletionDate ? new Date(data.scheduledCompletionDate) : null,
          graduationDate: data.graduationDate ? new Date(data.graduationDate) : null,
          totalUnits: data.totalUnits,
          transferredUnits: data.transferredUnits,
          unitQuantity: data.unitQuantity,
          totalUnitsEarned: data.totalUnitsEarned,
          enrollmentYear: data.startDate ? new Date(data.startDate).getFullYear() : new Date().getFullYear()
        }
      });
    }

    // 3️⃣ Si no existe, crear nuevo estudiante
    const studentId = BigInt(data.studentIdNumber);
    
    return await this.prisma.student.create({
      data: {
        id: studentId,
        studentIdNumber: data.studentIdNumber,
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        email: data.email,
        sdgkuEmail: data.sdgkuEmail,
        phone: data.phone,
        rgmKey: data.rgmKey,
        programId: program.id,
        modality: data.modality || 'Online',
        cohort: data.cohort,
        language: data.language || 'English',
        status: data.status || 'active',
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        scheduledCompletionDate: data.scheduledCompletionDate ? new Date(data.scheduledCompletionDate) : null,
        graduationDate: data.graduationDate ? new Date(data.graduationDate) : null,
        totalUnits: data.totalUnits || 126,
        transferredUnits: data.transferredUnits || 0,
        unitQuantity: data.unitQuantity || 0,
        totalUnitsEarned: data.totalUnitsEarned || 0,
        enrollmentYear: data.startDate ? new Date(data.startDate).getFullYear() : new Date().getFullYear()
      }
    });

  } catch (error) {
    console.error('❌ Error in importStudent:', error);
    throw new Error(`Failed to import student: ${error.message}`);
  }
}
}