import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { UserDto } from 'src/users/dto/user.dto';

@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get(':trainingCourseId/assigned')
  getAssignedUsers(
    @Param('trainingCourseId') trainingCourseId: string,
  ): Promise<UserDto[]> {
    return this.assignmentsService.getAssignedUsers(Number(trainingCourseId));
  }

  @Get(':trainingCourseId/assignable')
  getAssignableUsers(
    @Param('trainingCourseId') trainingCourseId: string,
  ): Promise<UserDto[]> {
    return this.assignmentsService.getAssignableUsers(Number(trainingCourseId));
  }

  @Post(':trainingCourseId/assign')
  assignUsers(
    @Param('trainingCourseId') trainingCourseId: string,
    @Body() body: { userIds: number[] },
  ) {
    return this.assignmentsService.assignUsersToTrainingCourse(
      Number(trainingCourseId),
      body.userIds,
    );
  }

  @Post(':trainingCourseId/unassign')
  unassignUsers(
    @Param('trainingCourseId') trainingCourseId: string,
    @Body() body: { userIds: number[] },
  ) {
    return this.assignmentsService.unassignUsersFromTrainingCourse(
      Number(trainingCourseId),
      body.userIds,
    );
  }
}