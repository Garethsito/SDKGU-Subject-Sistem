// Back-end/src/courses/courses.controller.ts
import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { CoursesService } from './courses.service';

@Controller('api/courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async findAll() {
    try {
      const courses = await this.coursesService.findAll();
      return courses;
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const course = await this.coursesService.findById(id);
      
      if (!course) {
        throw new NotFoundException(`Course with ID ${id} not found`);
      }
      
      return course;
    } catch (error) {
      console.error(`Error fetching course ${id}:`, error);
      throw error;
    }
  }
}