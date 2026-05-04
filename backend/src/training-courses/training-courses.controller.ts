import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TrainingCoursesService } from './training-courses.service';
import { CreateTrainingCourseDto } from './dto/create-training-course.dto';
import { UpdateTrainingCourseDto } from './dto/update-training-course.dto';
import { ModulesService } from 'src/modules/modules.service';

@Controller('training-courses')
export class TrainingCoursesController {
  constructor(
    private readonly trainingCoursesService: TrainingCoursesService,
    private readonly modulesService: ModulesService
  ) {}

  @Post()
  create(@Body() createTrainingCourseDto: CreateTrainingCourseDto) {
    return this.trainingCoursesService.create(createTrainingCourseDto);
  }

  @Get()
  findAll() {
    return this.trainingCoursesService.findAll();
  }

  @Get(':trainingCourseId/modules')
  findModules(@Param('trainingCourseId') trainingCourseId: string) {
    return this.modulesService.findAllForTrainingCourse(+trainingCourseId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.trainingCoursesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTrainingCourseDto: UpdateTrainingCourseDto) {
    return this.trainingCoursesService.update(+id, updateTrainingCourseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.trainingCoursesService.remove(+id);
  }
}
