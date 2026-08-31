import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleType } from '@prisma/client';
import { RolesGuard } from './roles.guard';

// ─── Helpers ────────────────────────────────────────────────────────────────

const mockContext = (
  user: { roles?: RoleType[] } | undefined,
): ExecutionContext =>
  ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  }) as unknown as ExecutionContext;

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow access when the route requires no roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const result = guard.canActivate(mockContext({ roles: [] }));

    expect(result).toBe(true);
  });

  it('should allow access when the route requires an empty role list', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

    const result = guard.canActivate(
      mockContext({ roles: [RoleType.STUDENT] }),
    );

    expect(result).toBe(true);
  });

  it('should allow access when the user has one of the required roles', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([RoleType.COORDINATOR, RoleType.TEACHER]);

    const result = guard.canActivate(
      mockContext({ roles: [RoleType.TEACHER] }),
    );

    expect(result).toBe(true);
  });

  it('should deny access when the user has none of the required roles', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([RoleType.COORDINATOR]);

    const result = guard.canActivate(
      mockContext({ roles: [RoleType.STUDENT] }),
    );

    expect(result).toBe(false);
  });

  it('should deny access when the user has no roles at all', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([RoleType.COORDINATOR]);

    const result = guard.canActivate(mockContext({ roles: undefined }));

    expect(result).toBe(false);
  });
});
