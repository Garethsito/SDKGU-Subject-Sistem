// Back-end/src/administrators/administrators.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AdministratorsService } from './administrators.services';
import type { CreateAdminDto } from './administrators.services'; // ✅ Usar 'type'

@Controller('api/administrators')
export class AdministratorsController {
  constructor(private readonly adminsService: AdministratorsService) {}

  @Get()
  async getAllAdmins() {
    try {
      return await this.adminsService.getAllAdmins();
    } catch (error) {
      throw new HttpException(
        error.message || 'Error fetching administrators',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async createAdmin(@Body() dto: CreateAdminDto) { // ✅ Ahora funcionará
    try {
      return await this.adminsService.createAdmin(dto);
    } catch (error) {
      if (error.message.includes('already exists')) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException(
        error.message || 'Error creating administrator',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async updateAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateAdminDto>,
  ) {
    try {
      return await this.adminsService.updateAdmin(id, dto);
    } catch (error) {
      if (error.message === 'Administrator not found') {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      if (error.message.includes('already exists')) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException(
        error.message || 'Error updating administrator',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async deleteAdmin(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.adminsService.deleteAdmin(id);
    } catch (error) {
      if (error.message === 'Administrator not found') {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        error.message || 'Error deleting administrator',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}