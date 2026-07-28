import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { verify as totpVerify } from 'otplib';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import { AUTH_REPOSITORY } from '../ports/auth.repository.token';
import type { AuthRepository } from '../ports/auth.repository.interface';
import { AuditLogService } from 'src/common/audit-log/audit-log.service';

@Injectable()
export class Verify2faUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly repo: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(
    userId: number,
    code: string,
    ip?: string,
  ): Promise<{ access_token: string; refresh_token: string; user: object }> {
    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    if (!user.twoFactorSecret || !user.id) throw new UnauthorizedException('2FA non configurée');

    const valid = await totpVerify({ token: code, secret: user.twoFactorSecret });
    if (!valid) {
      await this.auditLog.log({ userId, action: '2FA_FAILED', ip });
      throw new UnauthorizedException('Code TOTP invalide ou expiré');
    }

    const access_token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });

    const refresh_token = randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.repo.createRefreshToken(user.id, refresh_token, expiresAt);

    await this.auditLog.log({ userId, action: '2FA_SUCCESS', ip });

    return {
      access_token,
      refresh_token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }
}
