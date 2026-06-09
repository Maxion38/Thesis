import { Controller, Get, Param, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { RoleType } from '@prisma/client';
import { Auth } from '../auth/decorators/auth.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Auth(RoleType.COORDINATOR, RoleType.TEACHER)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Auth()
  @Get('my-first-project') // TODO : permit multiple projects
  findMyProject(@Req() req) {
    return this.usersService.findFirstProject(req.user.userId);
  }

  @Auth(RoleType.COORDINATOR)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }
}
