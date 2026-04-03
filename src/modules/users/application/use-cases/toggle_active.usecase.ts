import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { USERS_REPOSITORY } from '../ports/users.repository.token';
import type { UsersRepository, UserProfile } from '../ports/users.repository.interface';
import { Role } from 'src/common/enums/role.enum';

@Injectable()
export class ToggleActiveUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: UsersRepository,
  ) {}

  async execute(id: number): Promise<UserProfile> {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    // Empêcher la désactivation du dernier ADMIN actif
    if (user.isActive && user.role === Role.ADMIN) {
      const adminCount = await this.repo.countByRole(Role.ADMIN);
      if (adminCount <= 1) {
        throw new BadRequestException('Impossible de désactiver le dernier administrateur');
      }
    }

    return this.repo.setActive(id, !user.isActive);
  }
}
