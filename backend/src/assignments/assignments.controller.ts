import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { UserDto } from 'src/users/dto/user.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { RoleType } from '@prisma/client';

@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Auth(RoleType.COORDINATOR, RoleType.TEACHER)
  @Get(':trainingCourseId/assigned')
  getAssignedUsers(
    @Param('trainingCourseId') trainingCourseId: string,
  ): Promise<UserDto[]> {
    return this.assignmentsService.getAssignedUsers(Number(trainingCourseId));
  }

  @Auth(RoleType.COORDINATOR)
  @Get(':trainingCourseId/assignable')
  getAssignableUsers(
    @Param('trainingCourseId') trainingCourseId: string,
  ): Promise<UserDto[]> {
    return this.assignmentsService.getAssignableUsers(Number(trainingCourseId));
  }

  @Auth(RoleType.COORDINATOR)
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

  @Auth(RoleType.COORDINATOR)
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
