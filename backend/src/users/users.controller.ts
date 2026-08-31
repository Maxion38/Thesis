import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { RoleType } from '@prisma/client';
import { Auth } from '../auth/decorators/auth.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Auth(RoleType.COORDINATOR, RoleType.TEACHER)
  @Get()
  findAll(@Query('trainingCourseId') trainingCourseId?: string) {
    return this.usersService.findAll(
      trainingCourseId ? +trainingCourseId : undefined,
    );
  }

  @Auth()
  @Get('my-first-project')
  findMyProject(
    @Req() req,
    @Query('trainingCourseId') trainingCourseId?: string,
  ) {
    return this.usersService.findFirstProject(
      req.user.userId,
      trainingCourseId ? +trainingCourseId : undefined,
    );
  }

  @Auth(RoleType.COORDINATOR)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }
}
