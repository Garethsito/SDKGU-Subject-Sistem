// Back-end/src/auth/auth.services.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async validateUser(username: string, password: string) {
    try {
      const user = await this.prisma.login.findUnique({
        where: { username }
      });

      if (!user) {
        return { success: false, message: 'Usuario no encontrado' };
      }

      if (user.password !== password) {
        return { success: false, message: 'Contraseña incorrecta' };
      }

      return {
        success: true,
        message: 'Login exitoso',
        user: { id: user.id, username: user.username }
      };
    } catch (error) {
      console.error('Error en validateUser:', error);
      return { success: false, message: 'Error en el servidor' };
    }
  }
}