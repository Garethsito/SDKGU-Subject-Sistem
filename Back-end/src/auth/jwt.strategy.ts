// Back-end/src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from './constants';
import { PrismaService } from '../prisma/prisma.services';
import { AuthService } from './auth.services';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private prisma: PrismaService,
        private authService: AuthService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtConstants.secret,
            // Pasar el request completo para extraer el token
            passReqToCallback: true,
        });
    }

    async validate(request: any, payload: any) {
        // 🔍 Extraer el token completo del header
        const authHeader = request.headers.authorization;
        const token = authHeader ? authHeader.replace('Bearer ', '') : null;

        if (!token) {
            throw new UnauthorizedException('Token no proporcionado');
        }

        // Verificar que el usuario aún existe
        const user = await this.prisma.login.findUnique({
            where: { id: payload.sub }
        });

        if (!user || user.status !== 'Active') {
            throw new UnauthorizedException('Usuario inactivo o no encontrado');
        }

        // Verificar que sea el token activo actual
        const isValidToken = await this.authService.validateToken(payload.sub, token);

        if (!isValidToken) {
            throw new UnauthorizedException('Sesión cerrada en otro dispositivo');
        }

        return {
            userId: payload.sub,
            username: payload.username,
            role: payload.role
        };
    }
}