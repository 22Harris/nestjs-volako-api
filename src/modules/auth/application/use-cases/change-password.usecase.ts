import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AUTH_REPOSITORY } from '../ports/auth.repository.token';
import type { AuthRepository } from '../ports/auth.repository.interface';
import * as bcrypt from 'bcrypt';
import { AuditLogService } from 'src/common/audit-log/audit-log.service';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly repo: AuthRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new UnauthorizedException('Mot de passe actuel incorrect');

    const hashed = await bcrypt.hash(newPassword, 12);
    await this.repo.updatePassword(userId, hashed);
    await this.auditLog.log({ userId, action: 'PASSWORD_CHANGED' });
  }
}
