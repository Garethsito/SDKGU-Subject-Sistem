// sessions.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async createSession(data: any) {
    return this.prisma.session.create({
      data: {
        sessionName: data.sessionName,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        programId: data.programId,
      },
    });
  }

}
