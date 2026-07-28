import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { verify as totpVerify } from 'otplib';
import { AUTH_REPOSITORY } from '../ports/auth.repository.token';
import type { AuthRepository } from '../ports/auth.repository.interface';
import { AuditLogService } from 'src/common/audit-log/audit-log.service';

@Injectable()
export class Disable2faUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly repo: AuthRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(userId: number, code: string): Promise<void> {
    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('La 2FA n\'est pas activée');
    }

    const valid = await totpVerify({ token: code, secret: user.twoFactorSecret });
    if (!valid) throw new BadRequestException('Code TOTP invalide');

    await this.repo.disableTwoFactor(userId);
    await this.auditLog.log({ userId, action: '2FA_DISABLED', entity: 'User', entityId: userId });
  }
}
