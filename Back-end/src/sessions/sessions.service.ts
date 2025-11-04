// sessions.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  // Obtener todas las sesiones con información completa
  async getAllSessions() {
    const sessions = await this.prisma.session.findMany({
      include: {
        program: true,
        offerings: {
          include: {
            course: true,
            enrollments: true
          }
        }
      },
      orderBy: { sessionName: 'asc' }
    });

    return sessions.map(session => {
      const totalCapacity = session.offerings.reduce((sum, off) => sum + (off.maxStudents || 0), 0);
      const totalEnrolled = session.offerings.reduce((sum, off) => sum + off.enrollments.length, 0);
      const occupancy = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

      const month = new Date(session.startDate).toLocaleDateString('en-US', { month: 'long' });
      const subjects = session.offerings.map(off => off.course.courseCode);

      return {
        id: session.id,
        number: session.id,
        month,
        date: session.startDate.toISOString().split('T')[0],
        progress: occupancy,
        occupancy,
        subject: subjects.join(', ') || '',
        subjects,
        professor: '',
        chartId: `progressChart-${session.id}`,
        program: session.program.programName,
        programId: session.programId,
        status: new Date(session.endDate) > new Date() ? 'active' : 'completed'
      };
    });
  }

  // Obtener una sesión por ID
  async getSessionById(id: number) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: {
        program: true,
        offerings: {
          include: {
            course: true,
            enrollments: {
              include: {
                student: true
              }
            }
          }
        }
      }
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    return session;
  }

  // Crear nueva sesión
  async createSession(data: any) {
    const program = await this.prisma.program.findUnique({
      where: { id: data.programId }
    });

    if (!program) {
      throw new NotFoundException(`Program with ID ${data.programId} not found`);
    }

    return this.prisma.session.create({
      data: {
        sessionName: data.sessionName,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        programId: data.programId,
      },
      include: {
        program: true,
        offerings: {
          include: {
            course: true
          }
        }
      }
    });
  }

  // Actualizar sesión (incluyendo materias)
  async updateSession(id: number, data: any) {
    const session = await this.prisma.session.findUnique({ 
      where: { id },
      include: {
        offerings: true
      }
    });
    
    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    // Actualizar información básica de la sesión
    const updatedSession = await this.prisma.session.update({
      where: { id },
      data: {
        sessionName: data.sessionName,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        programId: data.programId,
      }
    });

    // Si se enviaron materias, actualizar las asignaciones
    if (data.courseIds && Array.isArray(data.courseIds)) {
      // Obtener materias actuales
      const currentCourseIds = session.offerings.map(off => off.courseId);
      const newCourseIds = data.courseIds;

      // Materias a eliminar (están en current pero no en new)
      const coursesToRemove = currentCourseIds.filter(id => !newCourseIds.includes(id));
      
      // Materias a agregar (están en new pero no en current)
      const coursesToAdd = newCourseIds.filter(id => !currentCourseIds.includes(id));

      // Eliminar materias que ya no están
      for (const courseId of coursesToRemove) {
        await this.prisma.courseOffering.delete({
          where: {
            courseId_sessionId: {
              courseId,
              sessionId: id
            }
          }
        }).catch(() => {
          // Si falla, puede ser porque tiene enrollments, lo ignoramos
          console.log(`Could not remove course ${courseId} from session ${id}`);
        });
      }

      // Agregar nuevas materias
      for (const courseId of coursesToAdd) {
        const course = await this.prisma.course.findUnique({ where: { id: courseId } });
        if (course) {
          await this.prisma.courseOffering.create({
            data: {
              courseId,
              sessionId: id,
              maxStudents: course.maxCapacity || 30
            }
          }).catch(() => {
            console.log(`Could not add course ${courseId} to session ${id}`);
          });
        }
      }
    }

    // Retornar sesión actualizada con todas las relaciones
    return this.prisma.session.findUnique({
      where: { id },
      include: {
        program: true,
        offerings: {
          include: {
            course: true
          }
        }
      }
    });
  }

  // Eliminar sesión
  async deleteSession(id: number) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: {
        offerings: {
          include: {
            enrollments: true
          }
        }
      }
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    const hasEnrollments = session.offerings.some(off => off.enrollments.length > 0);
    if (hasEnrollments) {
      throw new BadRequestException('Cannot delete session with active enrollments');
    }

    await this.prisma.courseOffering.deleteMany({
      where: { sessionId: id }
    });

    return this.prisma.session.delete({
      where: { id }
    });
  }

  // Obtener materias disponibles para agregar a una sesión
  async getAvailableCourses(sessionId: number) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        offerings: true
      }
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    const assignedCourseIds = session.offerings.map(off => off.courseId);

    return this.prisma.course.findMany({
      where: {
        programId: session.programId,
        id: {
          notIn: assignedCourseIds
        }
      },
      orderBy: { courseCode: 'asc' }
    });
  }

  // Agregar materia a sesión
  async addCourseToSession(sessionId: number, courseId: number, maxStudents?: number) {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    const existing = await this.prisma.courseOffering.findUnique({
      where: {
        courseId_sessionId: {
          courseId,
          sessionId
        }
      }
    });

    if (existing) {
      throw new BadRequestException('Course is already assigned to this session');
    }

    return this.prisma.courseOffering.create({
      data: {
        courseId,
        sessionId,
        maxStudents: maxStudents || course.maxCapacity || 30
      },
      include: {
        course: true,
        session: true
      }
    });
  }

  // Eliminar materia de sesión
  async removeCourseFromSession(sessionId: number, courseId: number) {
    const offering = await this.prisma.courseOffering.findUnique({
      where: {
        courseId_sessionId: {
          courseId,
          sessionId
        }
      },
      include: {
        enrollments: true
      }
    });

    if (!offering) {
      throw new NotFoundException('Course offering not found');
    }

    if (offering.enrollments.length > 0) {
      throw new BadRequestException('Cannot remove course with active enrollments');
    }

    return this.prisma.courseOffering.delete({
      where: {
        courseId_sessionId: {
          courseId,
          sessionId
        }
      }
    });
  }

  // Obtener materias asignadas a una sesión con estudiantes
  async getSessionCourses(sessionId: number) {
    const offerings = await this.prisma.courseOffering.findMany({
      where: { sessionId },
      include: {
        course: true,
        enrollments: {
          include: {
            student: true
          }
        }
      }
    });

    return offerings.map(off => ({
      id: off.course.id,
      offeringId: off.id,
      name: off.course.courseCode,
      code: off.course.courseCode,
      teacher: 'TBD',
      maxStudents: off.maxStudents,
      currentEnrollment: off.enrollments.length,
      students: off.enrollments.map(enr => ({
        id: enr.student.id.toString(),
        enrollmentId: enr.id,
        name: `${enr.student.firstName} ${enr.student.lastName}`,
        matricula: enr.student.studentIdNumber || `STU-${enr.student.id.toString().padStart(6, '0')}`,
        email: enr.student.email || enr.student.sdgkuEmail,
        status: enr.status === 'enrolled' ? 'active' : 'inactive',
        enrolledDate: new Date().toISOString().split('T')[0]      }))
    }));
  }

  // NUEVO: Agregar estudiante a una materia de la sesión
  async addStudentToCourse(sessionId: number, courseId: number, studentId: bigint) {
    // Verificar que la sesión existe
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    // Verificar que el offering existe
    const offering = await this.prisma.courseOffering.findUnique({
      where: {
        courseId_sessionId: {
          courseId,
          sessionId
        }
      },
      include: {
        enrollments: true
      }
    });

    if (!offering) {
      throw new NotFoundException('Course offering not found');
    }

    // Verificar que el estudiante existe
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    // Verificar capacidad
    if (offering.enrollments.length >= (offering.maxStudents ?? 30)) {
      throw new BadRequestException('Course is at maximum capacity');
    }

    // Verificar que el estudiante no esté ya inscrito
    const existingEnrollment = await this.prisma.enrollment.findUnique({
      where: {
        studentId_offeringId: {
          studentId,
          offeringId: offering.id
        }
      }
    });

    if (existingEnrollment) {
      throw new BadRequestException('Student is already enrolled in this course');
    }

    // Crear enrollment
    return this.prisma.enrollment.create({
      data: {
        studentId,
        offeringId: offering.id,
        status: 'enrolled'
      },
      include: {
        student: true,
        offering: {
          include: {
            course: true
          }
        }
      }
    });
  }

  // NUEVO: Remover estudiante de una materia de la sesión
  async removeStudentFromCourse(enrollmentId: number) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId }
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return this.prisma.enrollment.delete({
      where: { id: enrollmentId }
    });
  }

  // NUEVO: Obtener estudiantes disponibles para agregar a una materia
  async getAvailableStudents(sessionId: number, courseId: number) {
    const session = await this.prisma.session.findUnique({ 
      where: { id: sessionId },
      include: {
        program: true
      }
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    const offering = await this.prisma.courseOffering.findUnique({
      where: {
        courseId_sessionId: {
          courseId,
          sessionId
        }
      },
      include: {
        enrollments: true
      }
    });

    if (!offering) {
      throw new NotFoundException('Course offering not found');
    }

    // Obtener IDs de estudiantes ya inscritos
    const enrolledStudentIds = offering.enrollments.map(enr => enr.studentId);

    // Obtener estudiantes del programa que NO están inscritos en esta materia
    const availableStudents = await this.prisma.student.findMany({
      where: {
        programId: session.programId,
        status: 'active',
        id: {
          notIn: enrolledStudentIds
        }
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });

    return availableStudents.map(student => ({
      id: student.id.toString(),
      name: `${student.firstName} ${student.lastName}`,
      matricula: student.studentIdNumber || `STU-${student.id.toString().padStart(6, '0')}`,
      email: student.email || student.sdgkuEmail
    }));
  }
}