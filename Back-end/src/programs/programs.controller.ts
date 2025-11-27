import { Controller, Get, Post, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ProgramsService } from './programs.service';

@Controller('api/programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  getAllPrograms() {
    return this.programsService.getAllPrograms();
  }

  @Post()
  createProgram(@Body() body: {
    programName: string;
    programType: string;
    totalUnits: number;
    totalCourses: number;
    description?: string;
  }) {
    return this.programsService.create(body);
  }

  @Delete(':id')
  deleteProgram(@Param('id', ParseIntPipe) id: number) {
    return this.programsService.delete(id);
  }
}
