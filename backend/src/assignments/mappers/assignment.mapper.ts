import { User, Role, RoleType } from '@prisma/client';
import { UserDto } from 'src/users/dto/user.dto';
import { UserCardDto } from '../../users/dto/user-card.dto';

export function toUserDto(user: any): UserDto {
  return {
    id: user.id,
    email: user.email,
    surname: user.surname,
    firstname: user.firstname,
    roles: user.roles?.map((r: any) => r.role.role as RoleType) ?? [],
  };
}

export function toUserCardDto(
  user: User & { roles: Role[] },
  role: Role['role'],
): UserCardDto {
  return {
    user: toUserDto(user),
    role,
  };
}
