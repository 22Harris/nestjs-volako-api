import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AUTH_REPOSITORY } from '../ports/auth.repository.token';
import type { AuthRepository } from '../ports/auth.repository.interface';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { AuditLogService } from 'src/common/audit-log/audit-log.service';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly repo: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(
    email: string,
    password: string,
    ip?: string,
  ): Promise<
    | { access_token: string; refresh_token: string; user: any; requires2fa?: never }
    | { requires2fa: true; temp_token: string; user?: never }
  > {
    const user = await this.repo.findByEmail(email);
    if (!user) {
      await this.auditLog.log({ action: 'LOGIN_FAILED', details: `Email: ${email}`, ip });
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (!user.isActive) {
      await this.auditLog.log({ userId: user.id, action: 'LOGIN_FAILED', details: 'Compte désactivé', ip });
      throw new UnauthorizedException('Compte désactivé');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await this.auditLog.log({ userId: user.id, action: 'LOGIN_FAILED', details: `Email: ${email}`, ip });
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // 2FA activée → retourner un token temporaire (5 min) au lieu du vrai access_token
    if (user.twoFactorEnabled) {
      const temp_token = this.jwtService.sign(
        { sub: user.id, twoFactorPending: true },
        { expiresIn: '5m' },
      );
      await this.auditLog.log({ userId: user.id, action: 'LOGIN_2FA_REQUIRED', ip });
      return { requires2fa: true, temp_token };
    }

    const access_token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role, isActive: user.isActive });

    const refresh_token = randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.repo.createRefreshToken(user.id!, refresh_token, expiresAt);

    await this.auditLog.log({ userId: user.id, action: 'LOGIN_SUCCESS', ip });

    return {
      access_token,
      refresh_token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }
}
