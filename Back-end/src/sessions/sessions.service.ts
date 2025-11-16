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
            teacher: true, 
            enrollments: true
          }
        }
      },
      orderBy: [
        { id: 'asc' }
      ]
    });

    return sessions.map((session, index) => {
      const totalCapacity = session.offerings.reduce((sum, off) => sum + (off.maxStudents || 0), 0);
      const totalEnrolled = session.offerings.reduce((sum, off) => sum + off.enrollments.length, 0);
      const occupancy = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

      const month = new Date(session.startDate).toLocaleDateString('en-US', { month: 'long' });
      const subjects = session.offerings.map(off => off.course.courseCode);
      
      // Obtener el primer profesor (principal)
      const mainTeacher = session.offerings.find(off => off.teacher)?.teacher;
      
      // Extraer número de sesión del sessionName (ej: "Session 1" -> 1)
      const sessionNumberMatch = session.sessionName.match(/\d+/);
      const displayNumber = sessionNumberMatch ? parseInt(sessionNumberMatch[0]) : index + 1;
      
      return {
        id: session.id,
        number: displayNumber,
        sessionName: session.sessionName,
        year: session.year,
        month,
        startDate: session.startDate,
        endDate: session.endDate,
        date: session.startDate.toISOString().split('T')[0],
        progress: occupancy,
        occupancy,
        subject: subjects.join(', ') || 'No courses assigned',
        subjects,
        professor: mainTeacher 
          ? `${mainTeacher.firstName} ${mainTeacher.lastName}`
          : 'TBD',
        teacherId: mainTeacher?.id,
        chartId: `progressChart-${session.id}`,
        program: session.program.programName,
        programId: session.programId,
        status: new Date(session.endDate) > new Date() ? 'active' : 'completed'
      };
    });
  }

  // Obtener una sesión por ID - FORMATO PARA EDICIÓN
  async getSessionById(id: number) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: {
        program: true,
        offerings: {
          include: {
            course: true,
            teacher: true,
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

    // Obtener el profesor principal
    const mainTeacher = session.offerings.find(off => off.teacher)?.teacher;
    
    // Obtener array de códigos de curso
    const subjects = session.offerings.map(off => off.course.courseCode);

    // Extraer número de sesión del sessionName
    const sessionNumberMatch = session.sessionName.match(/\d+/);
    const displayNumber = sessionNumberMatch ? parseInt(sessionNumberMatch[0]) : null;

    return {
      id: session.id,
      number: displayNumber,
      sessionName: session.sessionName,
      year: session.year,
      startDate: session.startDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
      endDate: session.endDate.toISOString().split('T')[0],     // Formato YYYY-MM-DD
      program: session.program.programName,
      programId: session.programId,
      subjects: subjects, // Array de códigos
      teacherId: mainTeacher?.id,
      professor: mainTeacher 
        ? `${mainTeacher.firstName} ${mainTeacher.lastName}`
        : 'TBD',
      // Datos adicionales
      offerings: session.offerings.map(off => ({
        courseId: off.courseId,
        courseCode: off.course.courseCode,
        teacherId: off.teacherId
      }))
    };
  }

  // Crear nueva sesión
  async createSession(data: any) {
    const program = await this.prisma.program.findUnique({
      where: { id: data.programId }
    });

    if (!program) {
      throw new NotFoundException(`Program with ID ${data.programId} not found`);
    }

    // Determinar el año
    const startDate = new Date(data.startDate);
    const year = startDate.getFullYear();

    // ✅ Contar TODAS las sesiones globalmente (sin filtros)
    const totalSessions = await this.prisma.session.count();
    const sessionNumber = totalSessions + 1;

    // ✅ Validación: máximo 20 sesiones por año (10 por programa × 2 programas)
    const sessionsThisYear = await this.prisma.session.count({
      where: { year: year }
    });

    if (sessionsThisYear >= 20) {
      throw new BadRequestException(
        `Maximum of 20 sessions per year reached for ${year}`
      );
    }

    // ✅ Generar nombre único global
    const uniqueSessionName = `Session ${sessionNumber}`;

    // Crear la sesión
    const session = await this.prisma.session.create({
      data: {
        sessionName: uniqueSessionName,
        year: year,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        programId: data.programId,
      }
    });

    // Crear los CourseOfferings si se enviaron cursos
    if (data.courses && Array.isArray(data.courses) && data.courses.length > 0) {
      for (const courseData of data.courses) {
        const course = await this.prisma.course.findUnique({ 
          where: { id: courseData.courseId } 
        });
        
        if (course) {
          await this.prisma.courseOffering.create({
            data: {
              courseId: courseData.courseId,
              sessionId: session.id,
              teacherId: courseData.teacherId || null,
              maxStudents: course.maxCapacity || 30
            }
          });
        }
      }
    }

    // Retornar la sesión con sus relaciones
    return this.prisma.session.findUnique({
      where: { id: session.id },
      include: {
        program: true,
        offerings: {
          include: {
            course: true,
            teacher: true
          }
        }
      }
    });
  }

  // Actualizar sesión (incluyendo materias y profesores)
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

    // Calcular año si cambia la fecha
    const updateData: any = {
      sessionName: data.sessionName,
      programId: data.programId,
    };

    if (data.startDate) {
      const startDate = new Date(data.startDate);
      updateData.startDate = startDate;
      updateData.year = startDate.getFullYear();
    }

    if (data.endDate) {
      updateData.endDate = new Date(data.endDate);
    }

    await this.prisma.session.update({
      where: { id },
      data: updateData
    });

    // Si se enviaron materias con profesores
    if (data.courses && Array.isArray(data.courses)) {
      // Obtener los offerings actuales
      const currentOfferings = await this.prisma.courseOffering.findMany({
        where: { sessionId: id },
        include: { enrollments: true }
      });

      // IDs de cursos que vienen en el request
      const newCourseIds = data.courses.map(c => c.courseId);
      
      // Eliminar offerings que YA NO están en la lista
      // ESTO INCLUYE eliminar primero todos sus enrollments
      for (const offering of currentOfferings) {
        if (!newCourseIds.includes(offering.courseId)) {
          // Primero eliminar TODOS los enrollments de este offering
          await this.prisma.enrollment.deleteMany({
            where: { offeringId: offering.id }
          });
          
          // Luego eliminar el offering
          await this.prisma.courseOffering.delete({
            where: { id: offering.id }
          });
          
          console.log(`Removed course ${offering.courseId} and its ${offering.enrollments.length} enrollments`);
        }
      }

      // Actualizar o crear offerings
      for (const courseData of data.courses) {
        const course = await this.prisma.course.findUnique({ 
          where: { id: courseData.courseId } 
        });
        
        if (course) {
          // Verificar si ya existe
          const existing = currentOfferings.find(o => o.courseId === courseData.courseId);
          
          if (existing) {
            // ACTUALIZAR: Solo cambia el profesor, NO toca los estudiantes
            if (existing.teacherId !== courseData.teacherId) {
              await this.prisma.courseOffering.update({
                where: { id: existing.id },
                data: { teacherId: courseData.teacherId || null }
              });
            }
          } else {
            // CREAR NUEVO: Se crea vacío sin estudiantes
            await this.prisma.courseOffering.create({
              data: {
                courseId: courseData.courseId,
                sessionId: id,
                teacherId: courseData.teacherId || null,
                maxStudents: course.maxCapacity || 30
              }
            }).catch((error) => {
              console.log(`Could not add course ${courseData.courseId}:`, error);
            });
          }
        }
      }
    }

    // Retornar sesión actualizada
    return this.prisma.session.findUnique({
      where: { id },
      include: {
        program: true,
        offerings: {
          include: {
            course: true,
            teacher: true 
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

  // Obtener todos los profesores activos
  async getAllTeachers() {
    return this.prisma.teacher.findMany({
      where: { status: 'active' },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });
  }

  // Agregar materia a sesión con profesor
  async addCourseToSession(sessionId: number, courseId: number, teacherId?: number, maxStudents?: number) {
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
        courseId_sessionId: { courseId, sessionId }
      }
    });

    if (existing) {
      throw new BadRequestException('Course is already assigned to this session');
    }

    return this.prisma.courseOffering.create({
      data: {
        courseId,
        sessionId,
        teacherId: teacherId || null,
        maxStudents: maxStudents || course.maxCapacity || 30
      },
      include: {
        course: true,
        session: true,
        teacher: true
      }
    });
  }

  // Eliminar materia de sesión
  async removeCourseFromSession(sessionId: number, courseId: number) {
    const offering = await this.prisma.courseOffering.findUnique({
      where: {
        courseId_sessionId: { courseId, sessionId }
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
        courseId_sessionId: { courseId, sessionId }
      }
    });
  }

  // Obtener materias asignadas a una sesión con estudiantes
  async getSessionCourses(sessionId: number) {
    const offerings = await this.prisma.courseOffering.findMany({
      where: { sessionId },
      include: {
        course: true,
        teacher: true,
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
      name: off.course.courseName,
      code: off.course.courseCode,
      teacher: off.teacher 
        ? `${off.teacher.firstName} ${off.teacher.lastName}` 
        : 'TBD',
      teacherId: off.teacherId,
      maxStudents: off.maxStudents,
      currentEnrollment: off.enrollments.length,
      students: off.enrollments.map(enr => ({
        id: enr.student.id.toString(),
        enrollmentId: enr.id,
        name: `${enr.student.firstName} ${enr.student.lastName}`,
        matricula: enr.student.studentIdNumber || `STU-${enr.student.id.toString().padStart(6, '0')}`,
        email: enr.student.email || enr.student.sdgkuEmail,
        status: enr.status === 'enrolled' ? 'active' : 'inactive',
        enrolledDate: new Date().toISOString().split('T')[0]
      }))
    }));
  }

  // Agregar estudiante a una materia de la sesión
  async addStudentToCourse(sessionId: number, courseId: number, studentId: bigint) {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    const offering = await this.prisma.courseOffering.findUnique({
      where: {
        courseId_sessionId: { courseId, sessionId }
      },
      include: {
        enrollments: true
      }
    });

    if (!offering) {
      throw new NotFoundException('Course offering not found');
    }

    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    if (offering.enrollments.length >= (offering.maxStudents ?? 30)) {
      throw new BadRequestException('Course is at maximum capacity');
    }

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

    const enrollment = await this.prisma.enrollment.create({
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

    return {
      id: enrollment.id,
      status: enrollment.status,
      student: {
        id: enrollment.student.id.toString(),
        name: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        email: enrollment.student.email || enrollment.student.sdgkuEmail
      }
    };
  }

  // Remover estudiante de una materia de la sesión
  async removeStudentFromCourse(enrollmentId: number) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId }
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    await this.prisma.enrollment.delete({
      where: { id: enrollmentId }
    });

    return { 
      success: true, 
      message: 'Student removed successfully' 
    };
  }

  // Obtener estudiantes disponibles para agregar a una materia
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
        courseId_sessionId: { courseId, sessionId }
      },
      include: {
        enrollments: true
      }
    });

    if (!offering) {
      throw new NotFoundException('Course offering not found');
    }

    const enrolledStudentIds = offering.enrollments.map(enr => enr.studentId);

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