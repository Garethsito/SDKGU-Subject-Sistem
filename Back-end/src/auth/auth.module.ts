// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.services';
import { PrismaModule } from '../prisma/prisma.module';          
import { ActivityLogModule } from '../activityTimeline/activityTimeline.module';

@Module({
  imports: [PrismaModule,ActivityLogModule],
  controllers: [AuthController],
  providers: [AuthService], 
  exports: [AuthService],
})
export class AuthModule {}
