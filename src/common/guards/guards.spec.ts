import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Role } from 'src/common/enums/role.enum';

// ─── JwtAuthGuard ─────────────────────────────────────────────────────────────

describe('JwtAuthGuard', () => {
  function makeContext(token?: string, bearerHeader?: string) {
    const request: any = {
      cookies: token ? { access_token: token } : {},
      headers: bearerHeader ? { authorization: `Bearer ${bearerHeader}` } : {},
      user: undefined,
    };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getRequest: () => request,
    } as any;
  }

  const validPayload = { sub: 1, email: 'a@b.com', role: Role.DAF, isActive: true };

  it('autorise avec un cookie valide', () => {
    const jwtService = { verify: jest.fn().mockReturnValue(validPayload) } as any;
    const guard = new JwtAuthGuard(jwtService);
    const ctx = makeContext('valid-token');

    expect(guard.canActivate(ctx)).toBe(true);
    expect(ctx.switchToHttp().getRequest().user).toEqual({ id: 1, email: 'a@b.com', role: Role.DAF });
  });

  it('autorise avec un Authorization Bearer header', () => {
    const jwtService = { verify: jest.fn().mockReturnValue(validPayload) } as any;
    const guard = new JwtAuthGuard(jwtService);
    const ctx = makeContext(undefined, 'header-token');

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('lève UnauthorizedException si token absent', () => {
    const jwtService = { verify: jest.fn() } as any;
    const guard = new JwtAuthGuard(jwtService);
    const ctx = makeContext();

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('lève UnauthorizedException si token invalide', () => {
    const jwtService = { verify: jest.fn().mockImplementation(() => { throw new Error('invalid'); }) } as any;
    const guard = new JwtAuthGuard(jwtService);
    const ctx = makeContext('bad-token');

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('lève UnauthorizedException si compte désactivé', () => {
    const jwtService = { verify: jest.fn().mockReturnValue({ ...validPayload, isActive: false }) } as any;
    const guard = new JwtAuthGuard(jwtService);
    const ctx = makeContext('token');

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});

// ─── RolesGuard ───────────────────────────────────────────────────────────────

describe('RolesGuard', () => {
  function makeContext(userRole: Role | null, requiredRoles: Role[] | undefined) {
    const request: any = userRole ? { user: { role: userRole } } : { user: null };
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
    } as any;
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
    return { ctx, reflector };
  }

  it('autorise si aucun rôle requis', () => {
    const { ctx, reflector } = makeContext(Role.ASSISTANT, undefined);
    expect(new RolesGuard(reflector).canActivate(ctx)).toBe(true);
  });

  it('autorise si l\'utilisateur a le rôle requis', () => {
    const { ctx, reflector } = makeContext(Role.DAF, [Role.DAF, Role.ADMIN]);
    expect(new RolesGuard(reflector).canActivate(ctx)).toBe(true);
  });

  it('lève ForbiddenException si rôle insuffisant', () => {
    const { ctx, reflector } = makeContext(Role.ASSISTANT, [Role.DAF, Role.ADMIN]);
    expect(() => new RolesGuard(reflector).canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('lève ForbiddenException si pas d\'utilisateur', () => {
    const { ctx, reflector } = makeContext(null, [Role.DAF]);
    expect(() => new RolesGuard(reflector).canActivate(ctx)).toThrow(ForbiddenException);
  });
});
