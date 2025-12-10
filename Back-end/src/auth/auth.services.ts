// Back-end/src/auth/auth.services.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.services';
import { ActivityLogService } from '../activityTimeline/activityTimeline.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private activityLog: ActivityLogService,
  ) { }

  // Función para hashear contraseñas
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  // Verificar contraseña
  async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Login con JWT y sesión única
  async validateUser(username: string, password: string) {
    try {
      const user = await this.prisma.login.findUnique({
        where: { username }
      });

      if (!user) {
        await this.activityLog.logActivity({
          userId: null,
          entityCode: 'USER',
          entityId: null,
          activityCode: 'LOGIN_FAILED',
          description: `Login failed: username "${username}" not found`,
          oldData: null,
          newData: null,
          isImportant: true,
        });

        throw new UnauthorizedException('Credenciales inválidas');
      }

      const isPasswordValid = await this.comparePasswords(password, user.password);

      if (!isPasswordValid) {
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

        throw new UnauthorizedException('Credenciales inválidas');
      }

      if (user.status !== 'Active') {
        throw new UnauthorizedException('Usuario inactivo');
      }

      // Generar JWT Token
      const payload = {
        username: user.username,
        sub: user.id,
        role: user.role,
        // Timestamp único para identificar el token
        iat: Math.floor(Date.now() / 1000)
      };

      const access_token = this.jwtService.sign(payload);

      // Guardar token en la BD (invalidar sesión anterior)
      await this.prisma.login.update({
        where: { id: user.id },
        data: {
          activeToken: access_token,
          tokenIssuedAt: new Date()
        }
      });

      // Log de login exitoso
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
          loginTime: new Date().toISOString()
        },
        isImportant: false,
      });

      return {
        success: true,
        message: 'Login exitoso',
        access_token,
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        }
      };

    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      console.error('Error on validateUser:', error);
      throw new UnauthorizedException('Error en el servidor');
    }
  }

  // Validar que el token sea el activo actual
  async validateToken(userId: number, token: string): Promise<boolean> {
    const user = await this.prisma.login.findUnique({
      where: { id: userId },
      select: { activeToken: true, status: true }
    });

    if (!user || user.status !== 'Active') {
      return false;
    }

    // Verificar que el token coincida con el almacenado
    return user.activeToken === token;
  }

  // Logout (invalidar token)
  async logout(userId: number) {
    await this.prisma.login.update({
      where: { id: userId },
      data: {
        activeToken: null,
        tokenIssuedAt: null
      }
    });

    await this.activityLog.logActivity({
      userId: userId,
      entityCode: 'USER',
      entityId: userId,
      activityCode: 'LOGOUT',
      description: `User logged out`,
      oldData: null,
      newData: { logoutTime: new Date().toISOString() },
      isImportant: false,
    });

    return { success: true, message: 'Logout exitoso' };
  }

  // Registrar nuevo usuario
  async register(userData: {
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
  }) {
    const existingUser = await this.prisma.login.findUnique({
      where: { username: userData.username }
    });

    if (existingUser) {
      throw new UnauthorizedException('El usuario ya existe');
    }

    const hashedPassword = await this.hashPassword(userData.password);

    const user = await this.prisma.login.create({
      data: {
        username: userData.username,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role || 'Admin',
        status: 'Active'
      }
    });

    return {
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    };
  }
}