// Back-end/src/auth/auth.controller.ts
import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.services';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { username: string; password: string }) {
    const { username, password } = loginDto;

    if (!username || !password) {
      throw new HttpException(
        'Usuario y contraseña son requeridos',
        HttpStatus.BAD_REQUEST
      );
    }

    const result = await this.authService.validateUser(username, password);

    if (!result.success) {
      throw new HttpException(result.message, HttpStatus.UNAUTHORIZED);
    }

    return {
      success: true,
      message: 'Inicio de sesión exitoso',
      user: result.user
    };
  }
}