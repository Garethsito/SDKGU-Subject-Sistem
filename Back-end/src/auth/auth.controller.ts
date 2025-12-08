// Back-end/src/auth/auth.controller.ts
import { Controller, Post, Body, HttpException, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.services';
import { Public } from './public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // Login (público)
  @Public()
  @Post('login')
  async login(@Body() loginDto: { username: string; password: string }) {
    const { username, password } = loginDto;

    if (!username || !password) {
      throw new HttpException(
        'Username and password are required',
        HttpStatus.BAD_REQUEST
      );
    }

    return this.authService.validateUser(username, password);
  }

  // Logout (protegido)
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req) {
    return this.authService.logout(req.user.userId);
  }

  // Register (público - solo para testing)
  @Public()
  @Post('register')
  async register(@Body() registerDto: {
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
  }) {
    // Solo permitir en desarrollo
    if (process.env.NODE_ENV === 'production') {
      throw new HttpException('Registration disabled in production', HttpStatus.FORBIDDEN);
    }

    return this.authService.register(registerDto);
  }
}