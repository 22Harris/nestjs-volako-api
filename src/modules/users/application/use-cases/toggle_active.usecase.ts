import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { USERS_REPOSITORY } from '../ports/users.repository.token';
import type { UsersRepository, UserProfile } from '../ports/users.repository.interface';
import { Role } from 'src/common/enums/role.enum';
import { AuditLogService } from 'src/common/audit-log/audit-log.service';

@Injectable()
export class ToggleActiveUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: UsersRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(id: number, actorId?: number): Promise<UserProfile> {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    // Empêcher la désactivation du dernier ADMIN actif
    if (user.isActive && user.role === Role.ADMIN) {
      const adminCount = await this.repo.countByRole(Role.ADMIN);
      if (adminCount <= 1) {
        throw new BadRequestException('Impossible de désactiver le dernier administrateur');
      }
    }

    const updated = await this.repo.setActive(id, !user.isActive);

    await this.auditLog.log({
      userId: actorId,
      action: updated.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entity: 'User',
      entityId: id,
      details: `Utilisateur ${user.email} ${updated.isActive ? 'activé' : 'désactivé'}`,
    });

    return updated;
  }
}
