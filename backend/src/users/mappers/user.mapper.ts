import { UserDto } from '../dto/user.dto';

export function toDtoUser(user: any): UserDto {
  return {
    id: user.id,
    email: user.email,
    surname: user.surname,
    firstname: user.firstname,
    roles: user.roles?.map((r: any) => r.role.role) ?? [],
  };
}
