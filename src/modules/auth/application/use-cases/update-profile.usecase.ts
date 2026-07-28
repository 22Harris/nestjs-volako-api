import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AUTH_REPOSITORY } from '../ports/auth.repository.token';
import type { AuthRepository } from '../ports/auth.repository.interface';
import { AuditLogService } from 'src/common/audit-log/audit-log.service';

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly repo: AuthRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(userId: number, name: string, email: string): Promise<{ id: number; name: string; email: string }> {
    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    if (email !== user.email) {
      const conflict = await this.repo.findByEmail(email);
      if (conflict && conflict.id !== userId) throw new ConflictException('Cet email est déjà utilisé');
    }

    const updated = await this.repo.updateProfile(userId, name, email);
    await this.auditLog.log({ userId, action: 'PROFILE_UPDATED', details: `Nom/email mis à jour` });

    return { id: updated.id!, name: updated.name, email: updated.email };
  }
}
