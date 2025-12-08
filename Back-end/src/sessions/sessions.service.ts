// sessions.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';
import { MailService } from '../mail/mail.service';
import { ActivityLogService } from '../activityTimeline/activityTimeline.service';

@Injectable()
export class SessionsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private readonly activityLog: ActivityLogService) { }

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
        groupNumber: off.groupNumber, // IMPORTANTE: para mostrar sufijos en frontend
        teacherId: off.teacherId,
        teacher: off.teacher
      }))
    };
  }

  // Crear nueva sesión
  async createSession(data: any) {
    try {
      console.log('➡ DTO recibido para crear sesión:', data);

      if (!data.sessionName) {
        throw new BadRequestException('sessionName is required');
      }

      const existingSession = await this.prisma.session.findUnique({
        where: { sessionName: data.sessionName }
      });
      if (existingSession) {
        throw new BadRequestException(`Session name "${data.sessionName}" already exists`);
      }

      const program = await this.prisma.program.findUnique({ where: { id: data.programId } });
      if (!program) {
        throw new NotFoundException(`Program with ID ${data.programId} not found`);
      }

      const startDate = new Date(data.startDate);
      const year = startDate.getFullYear();

      const sessionsThisYear = await this.prisma.session.count({ where: { year } });
      if (sessionsThisYear >= 20) {
        throw new BadRequestException(`Maximum of 20 sessions per year reached for ${year}`);
      }

      const session = await this.prisma.session.create({
        data: {
          sessionName: data.sessionName,
          year,
          startDate,
          endDate: new Date(data.endDate),
          programId: data.programId
        }
      });

      if (data.courses && Array.isArray(data.courses)) {
        for (const courseData of data.courses) {
          const course = await this.prisma.course.findUnique({
            where: { id: courseData.courseId },
          });
          if (!course) continue;

          if (courseData.teacherId) {
            const teacher = await this.prisma.teacher.findUnique({
              where: { id: courseData.teacherId },
            });
            if (!teacher) courseData.teacherId = null;
          }

          // 🆕 Buscar si ya existe con groupNumber
          const existingOffering = await this.prisma.courseOffering.findFirst({
            where: {
              courseId: courseData.courseId,
              sessionId: session.id,
            },
            orderBy: { groupNumber: 'desc' }
          });

          // Si ya existe, crear con groupNumber + 1
          const groupNumber = existingOffering ? existingOffering.groupNumber + 1 : 1;

          const offering = await this.prisma.courseOffering.create({
            data: {
              courseId: courseData.courseId,
              sessionId: session.id,
              groupNumber: groupNumber, // Asignar número de grupo
              teacherId: courseData.teacherId || null,
              maxStudents: course.maxCapacity || 30,
            },
          });

          await this.activityLog.logActivity({
            userId: null,
            entityCode: 'COURSE_OFFERING',
            entityId: Number(offering.id),
            activityCode: 'CREATE',
            description: `CourseOffering ${offering.id} (Group ${groupNumber}) created for course ${course.id} in session ${session.id}`,
            oldData: null,
            newData: {
              id: Number(offering.id),
              courseId: offering.courseId,
              sessionId: offering.sessionId,
              groupNumber: offering.groupNumber,
              teacherId: offering.teacherId,
              maxStudents: offering.maxStudents,
            },
            isImportant: true,
          });
        }
      }

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

    } catch (err) {
      console.error('Error al crear sesión:', err);
      if (err.code === 'P2002') {
        throw new BadRequestException('Duplicate entry detected. Please check the data.');
      }
      throw new BadRequestException(err.message || 'Failed to create session');
    }
  }

  // Actualizar sesión
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

    const oldSessionCore = {
      id: session.id,
      sessionName: session.sessionName,
      year: session.year,
      startDate: session.startDate?.toISOString() ?? null,
      endDate: session.endDate?.toISOString() ?? null,
      programId: session.programId,
    };

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

    const newSessionCore = {
      id: id,
      sessionName: updateData.sessionName ?? session.sessionName,
      year: updateData.year ?? session.year,
      startDate: (updateData.startDate ?? session.startDate)?.toISOString() ?? null,
      endDate: (updateData.endDate ?? session.endDate)?.toISOString() ?? null,
      programId: updateData.programId ?? session.programId,
    };

    await this.activityLog.logActivity({
      userId: null,
      entityCode: 'SESSION',
      entityId: id,
      activityCode: 'UPDATE',
      description: `Session ${id} updated`,
      oldData: oldSessionCore,
      newData: newSessionCore,
      isImportant: true,
    });

    if (data.courses && Array.isArray(data.courses)) {
      const currentOfferings = await this.prisma.courseOffering.findMany({
        where: { sessionId: id },
        include: { enrollments: true }
      });

      // Crear mapa de cursos con groupNumber
      const newCourseMap = new Map();
      data.courses.forEach(c => {
        const key = `${c.courseId}`;
        if (!newCourseMap.has(key)) {
          newCourseMap.set(key, []);
        }
        newCourseMap.get(key).push(c);
      });

      // Eliminar offerings que ya no están
      for (const offering of currentOfferings) {
        const key = `${offering.courseId}`;
        if (!newCourseMap.has(key)) {
          // Eliminar enrollments primero
          for (const enrollment of offering.enrollments) {
            await this.activityLog.logActivity({
              userId: null,
              entityCode: 'ENROLLMENT',
              entityId: Number(enrollment.id),
              activityCode: 'DELETE',
              description: `Enrollment ${enrollment.id} deleted for offering ${offering.id}`,
              oldData: {
                id: Number(enrollment.id),
                studentId: Number(enrollment.studentId),
                offeringId: enrollment.offeringId,
                status: enrollment.status,
              },
              newData: null,
              isImportant: true,
            });
          }

          await this.prisma.enrollment.deleteMany({
            where: { offeringId: offering.id }
          });

          await this.activityLog.logActivity({
            userId: null,
            entityCode: 'COURSE_OFFERING',
            entityId: Number(offering.id),
            activityCode: 'DELETE',
            description: `CourseOffering ${offering.id} (Group ${offering.groupNumber}) removed from session ${id}`,
            oldData: {
              id: Number(offering.id),
              courseId: offering.courseId,
              sessionId: offering.sessionId,
              groupNumber: offering.groupNumber,
              teacherId: offering.teacherId,
              maxStudents: offering.maxStudents,
            },
            newData: null,
            isImportant: true,
          });

          await this.prisma.courseOffering.delete({
            where: { id: offering.id }
          });
        }
      }

      // Actualizar o crear offerings
      for (const courseData of data.courses) {
        const course = await this.prisma.course.findUnique({
          where: { id: courseData.courseId }
        });

        if (course) {
          // Buscar offering existente (primer grupo por defecto)
          const existing = currentOfferings.find(
            o => o.courseId === courseData.courseId && o.groupNumber === 1
          );

          if (existing) {
            // Solo actualizar profesor si cambió
            if (existing.teacherId !== courseData.teacherId) {
              const oldOffering = {
                id: Number(existing.id),
                courseId: existing.courseId,
                sessionId: existing.sessionId,
                groupNumber: existing.groupNumber,
                teacherId: existing.teacherId,
                maxStudents: existing.maxStudents,
              };

              const updatedOffering = await this.prisma.courseOffering.update({
                where: { id: existing.id },
                data: { teacherId: courseData.teacherId || null }
              });

              await this.activityLog.logActivity({
                userId: null,
                entityCode: 'COURSE_OFFERING',
                entityId: Number(existing.id),
                activityCode: 'UPDATE',
                description: `Teacher updated for CourseOffering ${existing.id} (Group ${existing.groupNumber}) in session ${id}`,
                oldData: oldOffering,
                newData: {
                  id: Number(updatedOffering.id),
                  courseId: updatedOffering.courseId,
                  sessionId: updatedOffering.sessionId,
                  groupNumber: updatedOffering.groupNumber,
                  teacherId: updatedOffering.teacherId,
                  maxStudents: updatedOffering.maxStudents,
                },
                isImportant: true,
              });
            }
          } else {
            // Crear nuevo offering (Grupo 1 si es el primero)
            try {
              const newOffering = await this.prisma.courseOffering.create({
                data: {
                  courseId: courseData.courseId,
                  sessionId: id,
                  groupNumber: 1, // Siempre Grupo 1 al agregar por primera vez
                  teacherId: courseData.teacherId || null,
                  maxStudents: course.maxCapacity || 30
                }
              });

              await this.activityLog.logActivity({
                userId: null,
                entityCode: 'COURSE_OFFERING',
                entityId: Number(newOffering.id),
                activityCode: 'CREATE',
                description: `CourseOffering ${newOffering.id} (Group ${newOffering.groupNumber}) created for course ${course.id} in session ${id}`,
                oldData: null,
                newData: {
                  id: Number(newOffering.id),
                  courseId: newOffering.courseId,
                  sessionId: newOffering.sessionId,
                  groupNumber: newOffering.groupNumber,
                  teacherId: newOffering.teacherId,
                  maxStudents: newOffering.maxStudents,
                },
                isImportant: true,
              });
            } catch (error) {
              console.log(`Could not add course ${courseData.courseId}:`, error);
            }
          }
        }
      }
    }

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

    // Datos "antes" de la sesión para el log
    const oldSessionData = {
      id: session.id,
      sessionName: session.sessionName,
      year: session.year,
      startDate: session.startDate?.toISOString() ?? null,
      endDate: session.endDate?.toISOString() ?? null,
      programId: session.programId,
    };

    // Contar estudiantes inscritos
    const totalEnrollments = session.offerings.reduce(
      (sum, off) => sum + off.enrollments.length,
      0
    );

    // 1) ELIMINAR todos los enrollments primero (y loguear cada uno)
    for (const offering of session.offerings) {
      if (offering.enrollments.length > 0) {
        for (const enrollment of offering.enrollments) {
          // Log de delete de ENROLLMENT
          await this.activityLog.logActivity({
            userId: null,
            entityCode: 'ENROLLMENT',
            entityId: Number(enrollment.id),
            activityCode: 'DELETE',
            description: `Enrollment ${enrollment.id} deleted when removing session ${id}`,
            oldData: {
              id: Number(enrollment.id),
              studentId: Number(enrollment.studentId),
              offeringId: enrollment.offeringId,
              status: enrollment.status,
            },
            newData: null,
            isImportant: true,
          });
        }

        await this.prisma.enrollment.deleteMany({
          where: { offeringId: offering.id }
        });
      }
    }

    // 2) Loguear y eliminar los CourseOfferings
    for (const offering of session.offerings) {
      // Log de delete de COURSE_OFFERING
      await this.activityLog.logActivity({
        userId: null,
        entityCode: 'COURSE_OFFERING',
        entityId: Number(offering.id),
        activityCode: 'DELETE',
        description: `CourseOffering ${offering.id} deleted from session ${id}`,
        oldData: {
          id: Number(offering.id),
          courseId: offering.courseId,
          sessionId: offering.sessionId,
          teacherId: offering.teacherId,
          maxStudents: offering.maxStudents,
        },
        newData: null,
        isImportant: true,
      });
    }

    await this.prisma.courseOffering.deleteMany({
      where: { sessionId: id }
    });

    // 3) Loguear y eliminar la sesión
    await this.activityLog.logActivity({
      userId: null,
      entityCode: 'SESSION',
      entityId: id,
      activityCode: 'DELETE',
      description: `Session ${id} deleted (with ${totalEnrollments} enrollments removed)`,
      oldData: oldSessionData,
      newData: null,
      isImportant: true,
    });

    // Intentar eliminar la sesión - Si ya fue eliminada, no es error
    try {
      await this.prisma.session.delete({
        where: { id }
      });
    } catch (error) {
      // Si el registro ya no existe (P2025), es OK ya que el objetivo era eliminarlo
      if (error.code !== 'P2025') {
        throw error; // Re-lanzar si es otro tipo de error
      }
    }

    // Retornar información sobre cuántos estudiantes se eliminaron
    return {
      success: true,
      message: 'Session deleted successfully',
      studentsRemoved: totalEnrollments
    };
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

    // Obtener cursos que pertenecen al programa de la sesión a través de ProgramCourse
    const programCourses = await this.prisma.programCourse.findMany({
      where: {
        programId: session.programId,
        courseId: {
          notIn: assignedCourseIds
        }
      },
      include: {
        course: true
      },
      orderBy: {
        course: {
          courseCode: 'asc'
        }
      }
    });

    return programCourses.map(pc => pc.course);
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

    // Buscar el groupNumber más alto existente para este curso en esta sesión
    const existingOfferings = await this.prisma.courseOffering.findMany({
      where: {
        courseId: courseId,
        sessionId: sessionId
      },
      orderBy: { groupNumber: 'desc' }
    });

    const nextGroupNumber = existingOfferings.length > 0
      ? existingOfferings[0].groupNumber + 1
      : 1;

    const offering = await this.prisma.courseOffering.create({
      data: {
        courseId,
        sessionId,
        groupNumber: nextGroupNumber, // Asignar siguiente número de grupo
        teacherId: teacherId || null,
        maxStudents: maxStudents || course.maxCapacity || 30
      },
      include: {
        course: true,
        session: true,
        teacher: true
      }
    });

    await this.activityLog.logActivity({
      userId: null,
      entityCode: 'COURSE_OFFERING',
      entityId: Number(offering.id),
      activityCode: 'CREATE',
      description: `CourseOffering ${offering.id} (Group ${offering.groupNumber}) created for course ${courseId} in session ${sessionId}`,
      oldData: null,
      newData: {
        id: Number(offering.id),
        courseId: offering.courseId,
        sessionId: offering.sessionId,
        groupNumber: offering.groupNumber,
        teacherId: offering.teacherId,
        maxStudents: offering.maxStudents,
      },
      isImportant: true,
    });

    return offering;
  }

  // Eliminar materia de sesión
  async removeCourseFromSession(sessionId: number, courseId: number, groupNumber: number = 1) {
    const offering = await this.prisma.courseOffering.findFirst({
      where: {
        courseId: courseId,
        sessionId: sessionId,
        groupNumber: 1
      },
      include: {
        enrollments: true,
        course: {
          include: {
            programCourses: true
          }
        }
      }
    });

    if (!offering) {
      throw new NotFoundException('Course offering not found');
    }

    if (offering.enrollments.length > 0) {
      throw new BadRequestException('Cannot remove course with active enrollments');
    }

    await this.activityLog.logActivity({
      userId: null,
      entityCode: 'COURSE_OFFERING',
      entityId: Number(offering.id),
      activityCode: 'DELETE',
      description: `CourseOffering ${offering.id} (Group ${offering.groupNumber}) removed from session ${sessionId}`,
      oldData: {
        id: Number(offering.id),
        courseId: offering.courseId,
        sessionId: offering.sessionId,
        groupNumber: offering.groupNumber,
        teacherId: offering.teacherId,
        maxStudents: offering.maxStudents,
      },
      newData: null,
      isImportant: true,
    });

    return this.prisma.courseOffering.delete({
      where: {
        courseId_sessionId_groupNumber: {
          courseId,
          sessionId,
          groupNumber
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
        teacher: true,
        enrollments: {
          include: {
            student: true
          }
        }
      },
      orderBy: [
        { course: { courseCode: 'asc' } },
        { groupNumber: 'asc' }
      ]
    });

    return offerings.map(off => {
      // Crear código con sufijo de grupo si es mayor a 1
      const courseCode = off.groupNumber > 1
        ? `${off.course.courseCode}-${off.groupNumber}`
        : off.course.courseCode;

      const courseName = off.groupNumber > 1
        ? `${off.course.courseName} (Group ${off.groupNumber})`
        : off.course.courseName;

      return {
        id: off.course.id,
        offeringId: off.id,
        groupNumber: off.groupNumber,
        name: courseName,
        code: courseCode,
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
      };
    });
  }

  // Agregar estudiante a una materia de la sesión
  async addStudentToCourse(sessionId: number, courseId: number, studentId: bigint, offeringId?: number) {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    let offering;
    if (offeringId) {
      offering = await this.prisma.courseOffering.findUnique({
        where: { id: offeringId },
        include: {
          enrollments: true,
          course: { include: { programCourses: true } }
        }
      });
    } else {
      offering = await this.prisma.courseOffering.findFirst({
        where: {
          courseId: courseId,
          sessionId: sessionId,
          groupNumber: 1
        },
        include: {
          enrollments: true,
          course: { include: { programCourses: true } }
        }
      });
    }

    if (!offering) {
      throw new NotFoundException('Course offering not found');
    }

    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    const maxCapacity = offering.maxStudents ?? 30;
    const currentEnrollment = offering.enrollments.length;

    console.log('Enrollment capacity check:', {
      currentEnrollment,
      maxCapacity,
      offeringId: offering.id,
      canEnroll: currentEnrollment < maxCapacity
    });

    if (currentEnrollment >= maxCapacity) {
      throw new BadRequestException(`Course is at maximum capacity (${currentEnrollment}/${maxCapacity})`);
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

    // Registrar en activity_log la inscripción (ENROLLMENT / CREATE)
    await this.activityLog.logActivity({
      userId: null, // cuando tengas auth, aquí puedes meter el id del usuario logueado
      entityCode: 'ENROLLMENT',
      entityId: Number(enrollment.id),
      activityCode: 'CREATE',
      description: `Student ${studentId.toString()} enrolled in course ${courseId} (session ${sessionId})`,
      oldData: null,
      newData: {
        id: Number(enrollment.id),
        studentId: Number(enrollment.studentId),
        offeringId: enrollment.offeringId,
        status: enrollment.status,
        // info útil extra para el timeline:
        sessionId: sessionId,
        courseId: courseId,
      },
      isImportant: true,
    });

    // Dejas intacto lo que tu frontend espera
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
    // 1) Buscar el enrollment antes de borrarlo
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId }
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    // 2) Registrar en activity_log ANTES de borrar
    await this.activityLog.logActivity({
      userId: null, // luego puedes pasar el id del usuario autenticado
      entityCode: 'ENROLLMENT',
      entityId: Number(enrollment.id),
      activityCode: 'DELETE',
      description: `Enrollment ${enrollment.id} removed from offering ${enrollment.offeringId}`,
      oldData: {
        id: Number(enrollment.id),
        studentId: Number(enrollment.studentId),
        offeringId: enrollment.offeringId,
        status: enrollment.status,
      },
      newData: null,
      isImportant: true,
    });

    // 3) Ahora sí borrar el enrollment
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

    const offering = await this.prisma.courseOffering.findFirst({
      where: {
        courseId: courseId,
        sessionId: sessionId,
        groupNumber: 1
      },
      include: {
        enrollments: true,
        course: {
          include: {
            programCourses: true
          }
        }
      }
    });

    if (!offering) {
      throw new NotFoundException('Course offering not found');
    }

    const enrolledStudentIds = offering.enrollments.map(enr => enr.studentId);

    // Obtener curso con programCourses
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        programCourses: true
      }
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const programIds = course.programCourses.map(pc => pc.programId);

    // Filtrar solo estudiantes del programa de la sesión
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

  /**
   * Enviar notificaciones de una sesión específica
   */
  async sendSessionNotifications(sessionId: number) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        offerings: {
          include: {
            enrollments: true
          }
        }
      }
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    const emailsSent = await this.mailService.sendSessionNotifications(
      sessionId,
      this.prisma
    );

    return {
      success: true,
      message: `Successfully sent ${emailsSent} email notification(s)`,
      emailsSent
    };
  }

  // Actualizar profesor de un offering
  async updateOfferingTeacher(offeringId: number, teacherId: number) {
    const offering = await this.prisma.courseOffering.findUnique({
      where: { id: offeringId },
      include: {
        course: true,
        session: true,
        teacher: true
      }
    });

    if (!offering) {
      throw new NotFoundException(`Course offering with ID ${offeringId} not found`);
    }

    // Verificar que el teacher existe
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId }
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherId} not found`);
    }

    const oldData = {
      id: Number(offering.id),
      courseId: offering.courseId,
      sessionId: offering.sessionId,
      groupNumber: offering.groupNumber,
      teacherId: offering.teacherId,
      maxStudents: offering.maxStudents,
    };

    // Actualizar el offering
    const updated = await this.prisma.courseOffering.update({
      where: { id: offeringId },
      data: { teacherId: teacherId },
      include: {
        course: true,
        session: true,
        teacher: true
      }
    });

    // Log de actividad
    await this.activityLog.logActivity({
      userId: null,
      entityCode: 'COURSE_OFFERING',
      entityId: Number(updated.id),
      activityCode: 'UPDATE',
      description: `Teacher assigned to CourseOffering ${updated.id} (Group ${updated.groupNumber})`,
      oldData: oldData,
      newData: {
        id: Number(updated.id),
        courseId: updated.courseId,
        sessionId: updated.sessionId,
        groupNumber: updated.groupNumber,
        teacherId: updated.teacherId,
        maxStudents: updated.maxStudents,
      },
      isImportant: true,
    });

    return {
      success: true,
      message: `Teacher ${teacher.firstName} ${teacher.lastName} assigned successfully`,
      offering: updated
    };
  }

}