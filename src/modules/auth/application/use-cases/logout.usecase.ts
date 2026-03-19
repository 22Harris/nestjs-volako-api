import { Inject, Injectable } from '@nestjs/common';
import { AUTH_REPOSITORY } from '../ports/auth.repository.token';
import type { AuthRepository } from '../ports/auth.repository.interface';
import { AuditLogService } from 'src/common/audit-log/audit-log.service';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly repo: AuthRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(refreshToken: string): Promise<void> {
    const tokenData = await this.repo.findRefreshToken(refreshToken);
    if (tokenData) {
      await this.repo.deleteRefreshToken(refreshToken);
      await this.auditLog.log({ userId: tokenData.userId, action: 'LOGOUT' });
    }
  }
}
