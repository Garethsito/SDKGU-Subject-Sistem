// Back-end/src/courses/courses.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    // Obtener todos los cursos
    const courses = await this.prisma.course.findMany({
      include: {
        program: {
          select: {
            programName: true
          }
        },
        prerequisites: {
          include: {
            prerequisiteCourse: {
              select: {
                courseCode: true
              }
            }
          }
        }
      },
      orderBy: {
        courseCode: 'asc'
      }
    });

    // Obtener total de estudiantes activos
    const totalActiveStudents = await this.prisma.student.count({
      where: { status: 'active' }
    });

    // Para cada curso, calcular estudiantes actuales, pasados y faltantes
    const coursesWithData = await Promise.all(
      courses.map(async (course) => {
        // 1. Estudiantes actualmente inscritos (enrollment activo en sesión activa)
        const currentStudents = await this.prisma.student.findMany({
          where: {
            status: 'active',
            enrollments: {
              some: {
                offering: {
                  courseId: course.id,
                  session: {
                    endDate: {
                      gte: new Date() // Sesiones que no han terminado
                    }
                  }
                },
                status: 'enrolled'
              }
            }
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentIdNumber: true
          }
        });

        // 2. Estudiantes que ya pasaron el curso (tienen AcademicRecord)
        const passedStudents = await this.prisma.student.findMany({
          where: {
            status: 'active',
            records: {
              some: {
                courseId: course.id,
                status: {
                  in: ['passed', 'completed', 'P'] // Ajusta según tus valores de status
                }
              }
            }
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentIdNumber: true
          }
        });

        // IDs de estudiantes que ya tienen el curso (inscritos o pasados)
        const studentsWithCourseIds = [
          ...currentStudents.map(s => s.id),
          ...passedStudents.map(s => s.id)
        ];

        // 3. Estudiantes que les falta el curso (del mismo programa, activos, sin el curso)
        const missingStudents = await this.prisma.student.findMany({
          where: {
            status: 'active',
            programId: course.programId,
            id: {
              notIn: studentsWithCourseIds
            },
            // NO tienen enrollment en este curso
            NOT: {
              enrollments: {
                some: {
                  offering: {
                    courseId: course.id
                  }
                }
              }
            },
            // NO tienen academic record de este curso
            AND: {
              NOT: {
                records: {
                  some: {
                    courseId: course.id
                  }
                }
              }
            }
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentIdNumber: true
          }
        });

        // Obtener la sesión más reciente para este curso
        const latestOffering = await this.prisma.courseOffering.findFirst({
          where: {
            courseId: course.id
          },
          include: {
            session: true,
            teacher: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            session: {
              startDate: 'desc'
            }
          }
        });

        // Formatear prerequisitos
        const prerequisites = course.prerequisites.map(
          p => p.prerequisiteCourse.courseCode
        );

        // Formatear estudiantes
        const formatStudent = (s: any) => ({
          id: s.id.toString(),
          name: `${s.firstName} ${s.lastName}`,
          studentId: s.studentIdNumber || `STU-${s.id.toString().padStart(6, '0')}`
        });

        return {
          id: course.id.toString(),
          code: course.courseCode,
          name: course.courseName,
          program: course.program.programName,
          session: latestOffering?.session.sessionName || 'No active session',
          maxStudents: latestOffering?.maxStudents || course.maxCapacity || 30,
          modality: 'Online', // Puedes agregar este campo a tu schema si lo necesitas
          instructor: latestOffering?.teacher 
            ? `${latestOffering.teacher.firstName} ${latestOffering.teacher.lastName}`
            : 'TBD',
          students: currentStudents.map(formatStudent),
          prerequisites,
          courseData: {
            passedStudents: passedStudents.map(formatStudent),
            missingStudents: missingStudents.map(formatStudent)
          }
        };
      })
    );

    return coursesWithData;
  }

  async findById(id: string) {
    const courseId = parseInt(id);
    
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        program: {
          select: {
            programName: true
          }
        },
        prerequisites: {
          include: {
            prerequisiteCourse: {
              select: {
                courseCode: true
              }
            }
          }
        }
      }
    });

    if (!course) {
      return null;
    }

    // Estudiantes actualmente inscritos
    const currentStudents = await this.prisma.student.findMany({
      where: {
        status: 'active',
        enrollments: {
          some: {
            offering: {
              courseId: course.id,
              session: {
                endDate: {
                  gte: new Date()
                }
              }
            },
            status: 'enrolled'
          }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentIdNumber: true
      }
    });

    // Estudiantes que pasaron
    const passedStudents = await this.prisma.student.findMany({
      where: {
        status: 'active',
        records: {
          some: {
            courseId: course.id,
            status: {
              in: ['passed', 'completed', 'P']
            }
          }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentIdNumber: true
      }
    });

    const studentsWithCourseIds = [
      ...currentStudents.map(s => s.id),
      ...passedStudents.map(s => s.id)
    ];

    // Estudiantes faltantes
    const missingStudents = await this.prisma.student.findMany({
      where: {
        status: 'active',
        programId: course.programId,
        id: {
          notIn: studentsWithCourseIds
        },
        NOT: {
          enrollments: {
            some: {
              offering: {
                courseId: course.id
              }
            }
          }
        },
        AND: {
          NOT: {
            records: {
              some: {
                courseId: course.id
              }
            }
          }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentIdNumber: true
      }
    });

    const latestOffering = await this.prisma.courseOffering.findFirst({
      where: {
        courseId: course.id
      },
      include: {
        session: true,
        teacher: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        session: {
          startDate: 'desc'
        }
      }
    });

    const prerequisites = course.prerequisites.map(
      p => p.prerequisiteCourse.courseCode
    );

    const formatStudent = (s: any) => ({
      id: s.id.toString(),
      name: `${s.firstName} ${s.lastName}`,
      studentId: s.studentIdNumber || `STU-${s.id.toString().padStart(6, '0')}`
    });

    return {
      id: course.id.toString(),
      code: course.courseCode,
      name: course.courseName,
      program: course.program.programName,
      session: latestOffering?.session.sessionName || 'No active session',
      maxStudents: latestOffering?.maxStudents || course.maxCapacity || 30,
      modality: 'Online',
      instructor: latestOffering?.teacher 
        ? `${latestOffering.teacher.firstName} ${latestOffering.teacher.lastName}`
        : 'TBD',
      students: currentStudents.map(formatStudent),
      prerequisites,
      courseData: {
        passedStudents: passedStudents.map(formatStudent),
        missingStudents: missingStudents.map(formatStudent)
      }
    };
  }
}