import { RoleType } from '../../entities/role.entity';
import { UserDto } from '../../users/dto/user.dto';
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