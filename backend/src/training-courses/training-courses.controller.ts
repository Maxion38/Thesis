import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
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

  @Auth(RoleType.COORDINATOR)
  @Get(':id/assigned-users')
  findAssignedUsers(
    @Param('id') trainingCourseId: number,
  ) {
    return this.trainingCoursesService.getAssignedUsers(
      Number(trainingCourseId)
    );
  }
  
  @Auth(RoleType.COORDINATOR)
  @Post(':id/assign-users')
  assignUsers(
    @Param('id') trainingCourseId: number,
    @Body() body: { userIds: number[] }
  ) {
    return this.trainingCoursesService.assignUsersToTrainingCourse(
      Number(trainingCourseId),
      body.userIds
    );
  }

  @Auth(RoleType.COORDINATOR)
  @Post(':id/unassign-users')
  unAssignUsers(
    @Param('id') trainingCourseId: number,
    @Body() body: { userIds: number[] }
  ) {
    return this.trainingCoursesService.unassignUsersFromTrainingCourse(
      Number(trainingCourseId),
      body.userIds
    );
  }
}
