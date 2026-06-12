import { extractRoles } from './roles.helper';
import { RoleType } from '@prisma/client';

describe('extractRoles', () => {
  it('should extract roles from user', () => {
    const user = {
      roles: [
        { role: { role: RoleType.STUDENT } },
        { role: { role: RoleType.TEACHER } },
      ],
    };

    const result = extractRoles(user);

    expect(result).toEqual([RoleType.STUDENT, RoleType.TEACHER]);
  });

  it('should return empty array when user has no roles', () => {
    const user = { roles: [] };

    const result = extractRoles(user);

    expect(result).toEqual([]);
  });

  it('should handle a single role', () => {
    const user = { roles: [{ role: { role: RoleType.COORDINATOR } }] };

    const result = extractRoles(user);

    expect(result).toEqual([RoleType.COORDINATOR]);
  });
});