import { ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

function makeReflector(requiredRoles: string[], isPublic = false) {
  return {
    getAllAndOverride: (key: string) => {
      if (key === 'isPublic') return isPublic;
      if (key === 'roles') return requiredRoles;
      return undefined;
    },
  } as any;
}

describe('RolesGuard', () => {
  it('should allow when no roles required', () => {
    const guard = new RolesGuard(makeReflector([]));
    const ok = guard.canActivate({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user: { roles: [] } }) }),
    } as any);
    expect(ok).toBe(true);
  });

  it('should forbid when missing required role', () => {
    const guard = new RolesGuard(makeReflector(['FINANCE']));
    expect(() =>
      guard.canActivate({
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({ user: { roles: ['RD_BUDGET_ADMIN'] } }),
        }),
      } as any),
    ).toThrow(ForbiddenException);
  });

  it('should allow when has required role', () => {
    const guard = new RolesGuard(makeReflector(['FINANCE']));
    const ok = guard.canActivate({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: ['FINANCE'] } }),
      }),
    } as any);
    expect(ok).toBe(true);
  });
});

