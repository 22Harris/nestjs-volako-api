import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AUTH_REPOSITORY } from '../ports/auth.repository.token';
import type { AuthRepository } from '../ports/auth.repository.interface';
import { JwtService } from '@nestjs/jwt';
import { AuditLogService } from 'src/common/audit-log/audit-log.service';

@Injectable()
export class RefreshUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly repo: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(refreshToken: string): Promise<{ access_token: string }> {
    const tokenData = await this.repo.findRefreshToken(refreshToken);

    if (!tokenData || tokenData.expiresAt < new Date()) {
      if (tokenData) await this.repo.deleteRefreshToken(refreshToken);
      await this.auditLog.log({ action: 'TOKEN_REFRESH_FAILED' });
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    const user = await this.repo.findById(tokenData.userId);
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');

    const access_token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role, isActive: user.isActive });
    await this.auditLog.log({ userId: user.id, action: 'TOKEN_REFRESH' });

    return { access_token };
  }
}
