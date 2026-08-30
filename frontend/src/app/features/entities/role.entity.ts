export enum RoleType {
  COORDINATOR = 'COORDINATOR',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  GUEST = 'GUEST',
}

export const ROLE_BASE_ROUTE: Record<RoleType, string> = {
  [RoleType.COORDINATOR]: 'coordinator',
  [RoleType.TEACHER]: 'teacher',
  [RoleType.STUDENT]: 'student',
  [RoleType.GUEST]: 'guest',
};