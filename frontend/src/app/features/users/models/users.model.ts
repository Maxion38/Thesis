import { RoleType } from "../../entities/role.entity";

export interface UserModel {
  id: number;
  surname: string;
  firstname?: string;
  email: string;
  roles: RoleType[];
}