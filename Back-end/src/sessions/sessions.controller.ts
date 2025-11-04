// sessions.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Controller('api/sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  async create(@Body() data: any) {
    return this.sessionsService.createSession(data);
  }
}
