import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { USERS_REPOSITORY } from '../ports/users.repository.token';
import type { UsersRepository, UserProfile, UpdateUserData } from '../ports/users.repository.interface';
import { AuditLogService } from 'src/common/audit-log/audit-log.service';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: UsersRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(id: number, data: UpdateUserData, actorId?: number): Promise<UserProfile> {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    if (data.email && data.email !== user.email) {
      const conflict = await this.repo.findByEmail(data.email);
      if (conflict) throw new ConflictException('Cet email est déjà utilisé');
    }

    const updated = await this.repo.update(id, data);

    await this.auditLog.log({
      userId: actorId,
      action: 'USER_UPDATED',
      entity: 'User',
      entityId: id,
      details: `Utilisateur ${updated.email} modifié`,
    });

    return updated;
  }
}
