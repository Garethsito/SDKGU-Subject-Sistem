// Back-end/src/courses/courses.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    // Obtener todos los cursos con sus programas a través de ProgramCourse
    const courses = await this.prisma.course.findMany({
      include: {
        programCourses: {
          include: {
            program: {
              select: {
                programName: true,
                id: true
              }
            }
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

    const totalActiveStudents = await this.prisma.student.count({
      where: { status: 'active' }
    });

    const coursesWithData = await Promise.all(
      courses.map(async (course) => {
        // Obtener todos los programIds relacionados con este curso
        const programIds = course.programCourses.map(pc => pc.programId);
        
        // Estudiantes actualmente inscritos
        const currentStudents = await this.prisma.student.findMany({
          where: {
            status: 'active',
            programId: {
              in: programIds // Buscar en todos los programas relacionados
            },
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

        // Estudiantes que ya pasaron el curso
        const passedStudents = await this.prisma.student.findMany({
          where: {
            status: 'active',
            programId: {
              in: programIds
            },
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

        // Estudiantes que les falta el curso (de TODOS los programas relacionados)
        const missingStudents = await this.prisma.student.findMany({
          where: {
            status: 'active',
            programId: {
              in: programIds
            },
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

        // Combinar nombres de programas
        const programNames = course.programCourses
          .map(pc => pc.program.programName)
          .join(' & ');

        return {
          id: course.id.toString(),
          code: course.courseCode,
          name: course.courseName,
          program: programNames, // Ahora puede ser "BSGM & ASSD"
          programIds: programIds, // IDs de programas relacionados
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
      })
    );

    return coursesWithData;
  }

  async findById(id: string) {
    const courseId = parseInt(id);
    
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        programCourses: {
          include: {
            program: {
              select: {
                programName: true,
                id: true
              }
            }
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

    const programIds = course.programCourses.map(pc => pc.programId);

    // Estudiantes actualmente inscritos
    const currentStudents = await this.prisma.student.findMany({
      where: {
        status: 'active',
        programId: {
          in: programIds
        },
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
        programId: {
          in: programIds
        },
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
        programId: {
          in: programIds
        },
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

    const programNames = course.programCourses
      .map(pc => pc.program.programName)
      .join(' & ');

    return {
      id: course.id.toString(),
      code: course.courseCode,
      name: course.courseName,
      program: programNames,
      programIds: programIds,
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