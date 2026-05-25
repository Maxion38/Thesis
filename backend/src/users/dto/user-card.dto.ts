import { RoleType } from '@prisma/client';
import { UserDto } from 'src/users/dto/user.dto';

export class UserCardDto {
  user!: UserDto;
  role!: RoleType;
}