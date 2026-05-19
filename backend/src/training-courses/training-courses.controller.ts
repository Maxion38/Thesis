import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TrainingCoursesService } from './training-courses.service';
import { CreateTrainingCourseDto } from './dto/create-training-course.dto';
import { UpdateTrainingCourseDto } from './dto/update-training-course.dto';
import { ModulesService } from '../modules/modules.service';
import { Role } from '../auth/entities/role.entity';
import { Auth } from '../auth/decorators/auth.decorator';

@Controller('training-courses')
export class TrainingCoursesController {
  constructor(
    private readonly trainingCoursesService: TrainingCoursesService,
    private readonly modulesService: ModulesService
  ) {}

  @Auth(Role.COORDINATOR)
  @Post()
  create(@Body() createTrainingCourseDto: CreateTrainingCourseDto) {
    return this.trainingCoursesService.create(createTrainingCourseDto);
  }

  @Auth()
  @Get()
  findAll() {
    return this.trainingCoursesService.findAll();
  }

  @Auth()
  @Get(':trainingCourseId/modules')
  findModules(@Param('trainingCourseId') trainingCourseId: string) {
    return this.modulesService.findAllForTrainingCourse(+trainingCourseId);
  }

  @Auth()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.trainingCoursesService.findOne(+id);
  }

  @Auth(Role.COORDINATOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTrainingCourseDto: UpdateTrainingCourseDto) {
    return this.trainingCoursesService.update(+id, updateTrainingCourseDto);
  }

  @Auth(Role.COORDINATOR)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.trainingCoursesService.remove(+id);
  }
}
