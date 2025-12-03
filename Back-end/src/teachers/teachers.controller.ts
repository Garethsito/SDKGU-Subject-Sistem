import { Controller, Get, Post, Body, Delete, Param } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';

@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  // GET /api/teachers
  @Get()
  async getAll() {
    return this.teachersService.findAll();
  }

  // POST /api/teachers
  @Post()
  async create(@Body() dto: CreateTeacherDto) {
    return this.teachersService.create(dto);
  }

  // DELETE /api/teachers/:id
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.teachersService.delete(Number(id));
  }
}
