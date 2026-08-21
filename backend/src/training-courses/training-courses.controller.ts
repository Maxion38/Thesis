import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { TrainingCoursesService } from './training-courses.service';
import { CreateTrainingCourseDto } from './dto/create-training-course.dto';
import { UpdateTrainingCourseDto } from './dto/update-training-course.dto';
import { ModulesService } from '../modules/modules.service';
import { RoleType } from '@prisma/client';
import { Auth } from '../auth/decorators/auth.decorator';

@Controller('training-courses')
export class TrainingCoursesController {
  constructor(
    private readonly trainingCoursesService: TrainingCoursesService,
    private readonly modulesService: ModulesService
  ) {}

  @Auth(RoleType.COORDINATOR)
  @Post()
  create(@Body() createTrainingCourseDto: CreateTrainingCourseDto) {
    return this.trainingCoursesService.create(createTrainingCourseDto);
  }

  @Auth()
  @Get()
  findAll() {
    return this.trainingCoursesService.findAll();
  }

  @Auth(RoleType.COORDINATOR)
  @Get('details')
  findAllWithDetails() {
    return this.trainingCoursesService.findAllWithRelatedInfos();
  }

  @Auth()
  @Get('mine')
  findMyActiveCourses(@Req() req) {
    return this.trainingCoursesService.findMyActiveCourses(req.user.userId);
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

  @Auth(RoleType.COORDINATOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTrainingCourseDto: UpdateTrainingCourseDto) {
    return this.trainingCoursesService.update(+id, updateTrainingCourseDto);
  }

  @Auth(RoleType.COORDINATOR)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.trainingCoursesService.remove(+id);
  }
}
