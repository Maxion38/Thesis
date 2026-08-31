import { RoleType } from '@prisma/client';

export class UserDto {
  id!: number;
  email!: string;
  surname!: string;
  firstname?: string;
  roles!: RoleType[];
}
