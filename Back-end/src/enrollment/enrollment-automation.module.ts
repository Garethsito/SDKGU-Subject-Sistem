// src/enrollment/enrollment-automation.module.ts
import { Module } from '@nestjs/common';
import { EnrollmentAutomationController } from './enrollment-automation.controller';
import { EnrollmentAutomationService } from './enrollment-automation.service';
import { PrismaService } from '../prisma/prisma.services';

@Module({
  controllers: [EnrollmentAutomationController],
  providers: [EnrollmentAutomationService, PrismaService],
  exports: [EnrollmentAutomationService]
})
export class EnrollmentAutomationModule {}