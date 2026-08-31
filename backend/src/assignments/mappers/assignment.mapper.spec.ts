import { RoleType } from '@prisma/client';
import { toUserDto, toUserCardDto } from './assignment.mapper';

describe('assignment.mapper', () => {
  describe('toUserDto', () => {
    it('should map a user with roles to a UserDto', () => {
      const user = {
        id: 1,
        email: 'alice@test.com',
        surname: 'Dupont',
        firstname: 'Alice',
        roles: [
          { role: { role: RoleType.STUDENT } },
          { role: { role: RoleType.TEACHER } },
        ],
      };

      const result = toUserDto(user);

      expect(result).toEqual({
        id: 1,
        email: 'alice@test.com',
        surname: 'Dupont',
        firstname: 'Alice',
        roles: [RoleType.STUDENT, RoleType.TEACHER],
      });
    });

    it('should default roles to an empty array when the user has none', () => {
      const user = {
        id: 1,
        email: 'alice@test.com',
        surname: 'Dupont',
        firstname: 'Alice',
        roles: undefined,
      };

      const result = toUserDto(user);

      expect(result.roles).toEqual([]);
    });
  });

  describe('toUserCardDto', () => {
    it('should wrap the mapped user with the given role', () => {
      const user = {
        id: 1,
        email: 'alice@test.com',
        surname: 'Dupont',
        firstname: 'Alice',
        roles: [{ role: { role: RoleType.STUDENT } }],
      } as any;

      const result = toUserCardDto(user, RoleType.STUDENT);

      expect(result).toEqual({
        user: {
          id: 1,
          email: 'alice@test.com',
          surname: 'Dupont',
          firstname: 'Alice',
          roles: [RoleType.STUDENT],
        },
        role: RoleType.STUDENT,
      });
    });
  });
});
