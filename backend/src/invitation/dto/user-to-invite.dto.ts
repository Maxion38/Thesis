import { IsEnum, IsEmail } from 'class-validator';
import { Role } from '../entities/role.entity';

export class UserToInviteDto {
  @IsEmail()
  email!: string; 
  
  @IsEnum(Role)
  role!: Role
}