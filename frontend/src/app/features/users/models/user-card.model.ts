import { UserModel } from "./users.model";
import { RoleType } from "../../entities/role.entity";

export type UserCardModel = {
  user: UserModel;
  role: RoleType;
};