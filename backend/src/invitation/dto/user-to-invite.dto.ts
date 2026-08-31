import { IsEnum, IsEmail } from 'class-validator';
import { RoleType } from '@prisma/client';

export class UserToInviteDto {
  @IsEmail()
  email!: string;

  @IsEnum(RoleType)
  role!: RoleType;
}
