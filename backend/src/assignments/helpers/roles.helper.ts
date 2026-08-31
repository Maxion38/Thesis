import { RoleType } from '@prisma/client';

export function extractRoles(user: any): RoleType[] {
  return user.roles.map((r: any) => r.role.role as RoleType);
}
