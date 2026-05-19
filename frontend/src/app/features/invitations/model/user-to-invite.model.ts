// import { Role } from '../../entities/role.entity'

export interface UserToInviteModel {
  email: string;
  role: string; // best if replaced by Role from role entity
}