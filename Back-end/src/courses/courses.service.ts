// Back-end/src/courses/courses.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';
import { ActivityLogService } from '../activityTimeline/activityTimeline.service';

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async findAll() {
    // 1️⃣ Obtener todos los cursos con relaciones necesarias
    const courses = await this.prisma.course.findMany({
      include: {
        programCourses: {
          include: {
            program: true,
          },
        },
        prerequisites: {
          include: {
            prerequisiteCourse: true,
          },
        },
        offerings: {
          include: {
            session: true,
            teacher: true,
          },
          orderBy: {
            session: { startDate: 'desc' },
          },
        },
      },
      orderBy: { courseCode: 'asc' },
    });

    // 2️⃣ Traer TODOS los estudiantes una sola vez
    const allStudents = await this.prisma.student.findMany({
      where: { status: 'active' },
      include: {
        enrollments: {
          include: {
            offering: {
              include: { session: true },
            },
          },
        },
        records: true,
      },
    });

    // 3️⃣ Procesar sin abrir conexiones adicionales
    const coursesWithData = courses.map((course) => {
      const programIds = course.programCourses.map((pc) => pc.programId);

      // Filtrar estudiantes del programa
      const studentsOfPrograms = allStudents.filter((s) =>
        programIds.includes(s.programId),
      );

      // Filtrar quienes están inscritos
      const currentStudents = studentsOfPrograms.filter((s) =>
        s.enrollments.some(
          (e) =>
            e.offering.courseId === course.id &&
            e.offering.session.endDate >= new Date() &&
            e.status === 'enrolled',
        ),
      );

      // Filtrar quienes ya pasaron el curso
      const passedStudents = studentsOfPrograms.filter((s) =>
        s.records.some(
          (r) =>
            r.courseId === course.id &&
            ['passed', 'completed', 'P'].includes(r.status ?? ''),
        ),
      );

      // Faltantes
      const takenIds = new Set([
        ...currentStudents.map((s) => s.id),
        ...passedStudents.map((s) => s.id),
      ]);

      const missingStudents = studentsOfPrograms.filter(
        (s) => !takenIds.has(s.id),
      );

      // Última oferta del curso
      const latestOffering = course.offerings[0];

      const formatStudent = (s: any) => ({
        id: s.id.toString(),
        name: `${s.firstName} ${s.lastName}`,
        studentId:
          s.studentIdNumber || `STU-${s.id.toString().padStart(6, '0')}`,
      });

      const programNames = course.programCourses
        .map((pc) => pc.program.programName)
        .join(' & ');

      return {
        id: course.id.toString(),
        code: course.courseCode,
        name: course.courseName,
        credits: course.credits,
        program: programNames,
        programIds,
        session: latestOffering?.session.sessionName || 'No active session',
        maxStudents: latestOffering?.maxStudents ?? course.maxCapacity ?? 30,
        modality: 'Online',
        instructor: latestOffering?.teacher
          ? `${latestOffering.teacher.firstName} ${latestOffering.teacher.lastName}`
          : 'TBD',
        students: currentStudents.map(formatStudent),
        prerequisites: course.prerequisites.map(
          (p) => p.prerequisiteCourse.courseCode,
        ),
        courseData: {
          passedStudents: passedStudents.map(formatStudent),
          missingStudents: missingStudents.map(formatStudent),
        },
      };
    });

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
                id: true,
              },
            },
          },
        },
        prerequisites: {
          include: {
            prerequisiteCourse: {
              select: {
                courseCode: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return null;
    }

    const programIds = course.programCourses.map((pc) => pc.programId);

    // Estudiantes actualmente inscritos
    const currentStudents = await this.prisma.student.findMany({
      where: {
        status: 'active',
        programId: {
          in: programIds,
        },
        enrollments: {
          some: {
            offering: {
              courseId: course.id,
              session: {
                endDate: {
                  gte: new Date(),
                },
              },
            },
            status: 'enrolled',
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentIdNumber: true,
      },
    });

    // Estudiantes que pasaron
    const passedStudents = await this.prisma.student.findMany({
      where: {
        status: 'active',
        programId: {
          in: programIds,
        },
        records: {
          some: {
            courseId: course.id,
            status: {
              in: ['passed', 'completed', 'P'],
            },
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentIdNumber: true,
      },
    });

    const studentsWithCourseIds = [
      ...currentStudents.map((s) => s.id),
      ...passedStudents.map((s) => s.id),
    ];

    // Estudiantes faltantes
    const missingStudents = await this.prisma.student.findMany({
      where: {
        status: 'active',
        programId: {
          in: programIds,
        },
        id: {
          notIn: studentsWithCourseIds,
        },
        NOT: {
          enrollments: {
            some: {
              offering: {
                courseId: course.id,
              },
            },
          },
        },
        AND: {
          NOT: {
            records: {
              some: {
                courseId: course.id,
              },
            },
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentIdNumber: true,
      },
    });

    const latestOffering = await this.prisma.courseOffering.findFirst({
      where: {
        courseId: course.id,
      },
      include: {
        session: true,
        teacher: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        session: {
          startDate: 'desc',
        },
      },
    });

    const prerequisites = course.prerequisites.map(
      (p) => p.prerequisiteCourse.courseCode,
    );

    const formatStudent = (s: any) => ({
      id: s.id.toString(),
      name: `${s.firstName} ${s.lastName}`,
      studentId:
        s.studentIdNumber || `STU-${s.id.toString().padStart(6, '0')}`,
    });

    const programNames = course.programCourses
      .map((pc) => pc.program.programName)
      .join(' & ');

    return {
      id: course.id.toString(),
      code: course.courseCode,
      name: course.courseName,
      credits: course.credits,
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
        missingStudents: missingStudents.map(formatStudent),
      },
    };
  }

  // Crear curso
  async createCourse(data: any) {
    const course = await this.prisma.course.create({
      data: {
        courseCode: data.courseCode,
        courseName: data.courseName,
        credits: parseInt(data.credits) || 3,
        language: data.language ?? null,
        isTransferable: data.isTransferable ?? true,
        maxCapacity: data.maxCapacity ? parseInt(data.maxCapacity) : null,
      },
    });

    // Auditoría CREATE
    await this.activityLog.logActivity({
      userId: null, // luego puedes pasar el admin real
      entityCode: 'COURSE',
      entityId: course.id,
      activityCode: 'CREATE',
      description: `Course created: ${course.courseCode} - ${course.courseName}`,
      oldData: null,
      newData: {
        id: course.id,
        courseCode: course.courseCode,
        courseName: course.courseName,
        credits: course.credits,
        language: course.language,
        isTransferable: course.isTransferable,
        maxCapacity: course.maxCapacity,
      },
      isImportant: true,
    });

    return course;
  }

  // Actualizar curso
  async updateCourse(id: number, data: any) {
    const oldCourse = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!oldCourse) {
      throw new NotFoundException('Course not found');
    }

    const course = await this.prisma.course.update({
      where: { id },
      data,
    });

    await this.activityLog.logActivity({
      userId: null,
      entityCode: 'COURSE',
      entityId: course.id,
      activityCode: 'UPDATE',
      description: `Course updated: ${course.courseCode} - ${course.courseName}`,
      oldData: {
        id: oldCourse.id,
        courseCode: oldCourse.courseCode,
        courseName: oldCourse.courseName,
        credits: oldCourse.credits,
        language: oldCourse.language,
        isTransferable: oldCourse.isTransferable,
        maxCapacity: oldCourse.maxCapacity,
      },
      newData: {
        id: course.id,
        courseCode: course.courseCode,
        courseName: course.courseName,
        credits: course.credits,
        language: course.language,
        isTransferable: course.isTransferable,
        maxCapacity: course.maxCapacity,
      },
      isImportant: true,
    });

    return course;
  }

  // Eliminar curso
  async deleteCourse(id: number) {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    await this.prisma.course.delete({
      where: { id },
    });

    await this.activityLog.logActivity({
      userId: null,
      entityCode: 'COURSE',
      entityId: course.id,
      activityCode: 'DELETE',
      description: `Course deleted: ${course.courseCode} - ${course.courseName}`,
      oldData: {
        id: course.id,
        courseCode: course.courseCode,
        courseName: course.courseName,
        credits: course.credits,
        language: course.language,
        isTransferable: course.isTransferable,
        maxCapacity: course.maxCapacity,
      },
      newData: null,
      isImportant: true,
    });

    return course;
  }
}
