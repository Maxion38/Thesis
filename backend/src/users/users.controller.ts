import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { RoleType } from '@prisma/client';
import { Auth } from '../auth/decorators/auth.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Auth(RoleType.COORDINATOR)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }
}
