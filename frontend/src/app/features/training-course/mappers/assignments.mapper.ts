import { RoleType } from '../../entities/role.entity';
import { UserCardDto } from '../../users/dto/user-card.dto';
import { UserDto } from '../../users/dto/user.dto';
import { UserCardModel } from '../../users/models/user-card.model';
import { UserModel } from '../../users/models/users.model';

export function toUserModel(dto: UserDto): UserModel {
  return {
    id: dto.id,
    email: dto.email,
    surname: dto.surname,
    firstname: dto.firstname,
    roles: dto.roles.map(r => r as RoleType)
  };
}

export function toUserCardModel(dto: UserCardDto): UserCardModel {
  return {
    user: toUserModel(dto.user),
    role: dto.role as RoleType,
  };
}