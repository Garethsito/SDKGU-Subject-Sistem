// Back-end/src/auth/auth.services.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';
import { ActivityLogService } from '../activityTimeline/activityTimeline.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async validateUser(username: string, password: string) {
    try {
      const user = await this.prisma.login.findUnique({
        where: { username }
      });

      // Usuario no encontrado
      if (!user) {
        // Log de intento de login fallido (usuario inexistente)
        await this.activityLog.logActivity({
          userId: null,                // no sabemos el user_id porque no existe
          entityCode: 'USER',
          entityId: null,
          activityCode: 'LOGIN_FAILED', 
          description: `Login failed: username "${username}" not found`,
          oldData: null,
          newData: null,
          isImportant: true,
        });

        return { success: false, message: 'User not found' };
      }

      // Password incorrecto
      if (user.password !== password) {
        // Log de intento de login fallido (password mala)
        await this.activityLog.logActivity({
          userId: user.id,
          entityCode: 'USER',
          entityId: user.id,
          activityCode: 'LOGIN_FAILED',
          description: `Login failed: wrong password for user "${username}"`,
          oldData: null,
          newData: null,
          isImportant: true,
        });

        return { success: false, message: 'Incorrect password' };
      }

      // Login exitoso
      await this.activityLog.logActivity({
        userId: user.id,
        entityCode: 'USER',
        entityId: user.id,
        activityCode: 'LOGIN',
        description: `User "${username}" logged in successfully`,
        oldData: null,
        newData: {
          userId: user.id,
          username: user.username,
          
        },
        isImportant: false,
      });

      return {
        success: true,
        message: 'Successful Login',
        user: { id: user.id, username: user.username }
      };
    } catch (error) {
      console.error('Error on validateUser:', error);

      // log de error de sistema
      // await this.activityLog.logActivity({
      //   userId: null,
      //   entityCode: 'SYSTEM',
      //   entityId: null,
      //   activityCode: 'ERROR',
      //   description: `Error on validateUser for username "${username}"`,
      //   oldData: null,
      //   newData: { error: String(error) },
      //   isImportant: true,
      // });

      return { success: false, message: 'Server error ):' };
    }
  }

}