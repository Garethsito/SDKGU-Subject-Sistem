// src/notifications/notifications.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.services';
import { MailService } from '../mail/mail.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService
  ) {}

  /**
   * Función que verifica si quedan exactamente 7 días para el inicio
   * (Reutilizando la lógica que ya tienes en sessions.js)
   */
  private isSevenDaysBeforeStart(sessionStartDate: Date): boolean {
    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const sessionDateLocal = new Date(
      sessionStartDate.getFullYear(),
      sessionStartDate.getMonth(),
      sessionStartDate.getDate()
    );
    
    const diffTime = sessionDateLocal.getTime() - todayLocal.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Retorna true si quedan exactamente 7 días
    return diffDays === 7;
  }

  /**
   * Cron job que se ejecuta todos los días a las 8:00 AM
   * para verificar sesiones que inicien en 7 días
   */
  @Cron('0 8 * * *') // Cada día a las 8:00 AM
  async checkUpcomingSessions() {
    this.logger.log('🔍 Checking for sessions starting in 7 days...');

    try {
      // Obtener todas las sesiones activas
      const sessions = await this.prisma.session.findMany({
        where: {
          startDate: {
            gte: new Date(), // Solo sesiones futuras
          },
        },
        include: {
          program: true,
          offerings: {
            include: {
              enrollments: true,
            },
          },
        },
      });

      let totalEmailsSent = 0;

      for (const session of sessions) {
        // Verificar si quedan exactamente 7 días
        if (this.isSevenDaysBeforeStart(session.startDate)) {
          this.logger.log(
            `📧 Sending notifications for session: ${session.sessionName}`
          );

          try {
            const emailsSent = await this.mailService.sendSessionNotifications(
              session.id,
              this.prisma
            );

            totalEmailsSent += emailsSent;

            this.logger.log(
              `✅ Sent ${emailsSent} emails for session ${session.sessionName}`
            );
          } catch (error) {
            this.logger.error(
              `❌ Error sending notifications for session ${session.id}: ${error.message}`
            );
          }
        }
      }

      this.logger.log(
        `📊 Total emails sent today: ${totalEmailsSent}`
      );
    } catch (error) {
      this.logger.error(`❌ Error in checkUpcomingSessions: ${error.message}`);
    }
  }

  /**
   * Método manual para enviar notificaciones de una sesión específica
   * (útil para testing o envíos manuales desde el frontend)
   */
  async sendManualNotification(sessionId: number): Promise<number> {
    this.logger.log(`📧 Manual notification triggered for session ${sessionId}`);
    
    return await this.mailService.sendSessionNotifications(
      sessionId,
      this.prisma
    );
  }
}