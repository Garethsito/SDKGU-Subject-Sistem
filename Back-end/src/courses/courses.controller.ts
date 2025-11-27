import {
  Controller,
  Get,
  Param,
  NotFoundException,
  Post,
  Body,
  Patch,
  Delete,
  ParseIntPipe
} from '@nestjs/common';
import { CoursesService } from './courses.service';

@Controller('api/courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async findAll() {
    return this.coursesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const course = await this.coursesService.findById(id);
    if (!course) throw new NotFoundException(`Course ${id} not found`);
    return course;
  }

  // ---------------------
  //     🟢 CREATE
  // ---------------------
  @Post()
  async create(@Body() data: any) {
    return this.coursesService.createCourse(data);
  }

  // ---------------------
  //     🟡 UPDATE
  // ---------------------
  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.coursesService.updateCourse(id, data);
  }

  // ---------------------
  //     🔴 DELETE
  // ---------------------
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.deleteCourse(id);
  }
}
