import { toDtoUser } from './user.mapper';

describe('toDtoUser', () => {
  it('should map user with roles correctly', () => {
    const user = {
      id: 1,
      email: 'alice@test.com',
      surname: 'Dupont',
      firstname: 'Alice',
      roles: [{ role: { role: 'STUDENT' } }, { role: { role: 'COORDINATOR' } }],
    };

    const result = toDtoUser(user);

    expect(result).toEqual({
      id: 1,
      email: 'alice@test.com',
      surname: 'Dupont',
      firstname: 'Alice',
      roles: ['STUDENT', 'COORDINATOR'],
    });
  });

  it('should return empty roles array when roles is undefined', () => {
    const user = {
      id: 2,
      email: 'bob@test.com',
      surname: 'Martin',
      firstname: 'Bob',
      roles: undefined,
    };

    const result = toDtoUser(user);

    expect(result.roles).toEqual([]);
  });

  it('should return empty roles array when roles is empty', () => {
    const user = {
      id: 3,
      email: 'carol@test.com',
      surname: 'Leroy',
      firstname: 'Carol',
      roles: [],
    };

    const result = toDtoUser(user);

    expect(result.roles).toEqual([]);
  });
});
