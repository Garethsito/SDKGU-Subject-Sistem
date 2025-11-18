// src/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  /**
   * Envía notificación de inscripción a un estudiante
   */
  async sendEnrollmentNotification(
    studentName: string,
    studentEmail: string,
    studentSdgkuEmail: string,
    sessionName: string,
    sessionStartDate: string,
    sessionEndDate: string,
    programName: string,
    courses: Array<{
      courseCode: string;
      courseName: string;
      teacherName: string;
      maxStudents: number;
    }>
  ): Promise<void> {
    const courseList = courses
      .map(
        (course, index) => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 15px 10px;">
            <strong style="color: #D41736; font-size: 16px;">${course.courseCode}</strong>
            <br/>
            <span style="color: #666;">${course.courseName}</span>
          </td>
          <td style="padding: 15px 10px;">
            <i style="color: #A6192E;">👨‍🏫</i> ${course.teacherName}
          </td>
          <td style="padding: 15px 10px; text-align: center;">
            <span style="background: #f0f0f0; padding: 5px 10px; border-radius: 5px;">
              ${course.maxStudents} students
            </span>
          </td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 650px; margin: 30px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #D41736 0%, #A6192E 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px; color: #333; }
    .info-box { background: #f9f9f9; border-left: 4px solid #D41736; padding: 15px; margin: 20px 0; }
    .courses-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .footer { background: #2D2828; color: #999; padding: 20px; text-align: center; font-size: 12px; }
    .button { display: inline-block; background: #D41736; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 Session Enrollment Confirmation</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">San Diego Global Knowledge University</p>
    </div>
    
    <div class="content">
      <h2 style="color: #D41736;">Hello, ${studentName}! 👋</h2>
      
      <p style="font-size: 16px; line-height: 1.6;">
        We're excited to confirm your enrollment for the upcoming <strong>${sessionName}</strong>!
        Your classes will begin in <strong style="color: #D41736;">7 days</strong>.
      </p>

      <div class="info-box">
        <strong style="color: #D41736;">📅 Session Details:</strong><br/>
        <strong>Program:</strong> ${programName}<br/>
        <strong>Start Date:</strong> ${new Date(sessionStartDate).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}<br/>
        <strong>End Date:</strong> ${new Date(sessionEndDate).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </div>

      <h3 style="color: #D41736; margin-top: 30px;">📚 Your Enrolled Courses:</h3>
      <table class="courses-table">
        <thead>
          <tr style="background: #f5f5f5; border-bottom: 2px solid #D41736;">
            <th style="padding: 12px 10px; text-align: left;">Course</th>
            <th style="padding: 12px 10px; text-align: left;">Professor</th>
            <th style="padding: 12px 10px; text-align: center;">Class Size</th>
          </tr>
        </thead>
        <tbody>
          ${courseList}
        </tbody>
      </table>

      <div style="background: #fff8dc; border: 1px solid #F69A1C; border-radius: 5px; padding: 15px; margin: 25px 0;">
        <strong style="color: #F69A1C;">⚠️ Important Reminders:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Classes start in <strong>7 days</strong> - mark your calendar!</li>
          <li>Check your course materials on the student portal</li>
          <li>Contact your professors if you have any questions</li>
          <li>Ensure your payment is up to date</li>
        </ul>
      </div>

      <div style="text-align: center;">
        <a href="https://sdgku.edu/student-portal" class="button">Access Student Portal</a>
      </div>

      <p style="margin-top: 30px; color: #666;">
        If you have any questions or concerns, please don't hesitate to contact our academic support team.
      </p>

      <p style="font-weight: bold; color: #D41736;">
        Good luck with your studies! 🚀
      </p>
    </div>

    <div class="footer">
      <p><strong>San Diego Global Knowledge University</strong></p>
      <p>📧 support@sdgku.edu | 📞 +1 (XXX) XXX-XXXX</p>
      <p style="margin-top: 10px; font-size: 11px;">
        This is an automated notification. Please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const emails = [studentEmail, studentSdgkuEmail].filter(email => email);

    // 🔒 MODO SEGURO: Solo enviar a correos de prueba
    const testEmails = process.env.TEST_EMAILS?.split(',') || [];
    console.log('🔍 TEST_EMAILS configurados:', testEmails); // ← AGREGAR ESTO
    console.log('📧 Emails del estudiante:', emails);

    const safeEmails = emails.filter(email => 
      testEmails.some(testEmail => email?.includes(testEmail))
    );

    // Si no hay correos seguros, registrar pero no enviar
    if (safeEmails.length === 0) {
      this.logger.warn(`⚠️ Skipping email to ${emails.join(', ')} - Not in TEST_EMAILS whitelist`);
      return;
    }

    try {
      for (const email of emails) {
        await this.transporter.sendMail({
          from: process.env.MAIL_FROM || process.env.MAIL_USER,
          to: email,
          subject: `🎓 Enrollment Confirmation - ${sessionName} | SDGKU`,
          html: htmlContent,
        });

        this.logger.log(`✅ Email sent successfully to ${email}`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to send email: ${error.message}`);
      this.logger.error(`❌ Full error:`, error);
      throw error;
    }
  }

  /**
   * Envía notificaciones a todos los estudiantes de una sesión
   */
  async sendSessionNotifications(sessionId: number, prisma: any): Promise<number> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        program: true,
        offerings: {
          include: {
            course: true,
            teacher: true,
            enrollments: {
              include: {
                student: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Agrupar cursos por estudiante
    const studentCourses = new Map<bigint, Array<any>>();

    for (const offering of session.offerings) {
      for (const enrollment of offering.enrollments) {
        if (!studentCourses.has(enrollment.studentId)) {
          studentCourses.set(enrollment.studentId, []);
        }

        studentCourses.get(enrollment.studentId)!.push({
          courseCode: offering.course.courseCode,
          courseName: offering.course.courseName,
          teacherName: offering.teacher
            ? `${offering.teacher.firstName} ${offering.teacher.lastName}`
            : 'TBD',
          maxStudents: offering.maxStudents || 30,
        });
      }
    }

    let emailsSent = 0;

    // Enviar correo a cada estudiante
    for (const [studentId, courses] of studentCourses.entries()) {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
      });

      if (student && courses.length > 0) {
        try {
          await this.sendEnrollmentNotification(
            `${student.firstName} ${student.lastName}`,
            student.email,
            student.sdgkuEmail,
            session.sessionName,
            session.startDate.toISOString().split('T')[0],
            session.endDate.toISOString().split('T')[0],
            session.program.programName,
            courses
          );
          emailsSent++;
        } catch (error) {
          this.logger.error(
            `Failed to send email to student ${studentId}: ${error.message}`
          );
        }
      }
    }

    return emailsSent;
  }
}