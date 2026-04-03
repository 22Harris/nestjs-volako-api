import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { USERS_REPOSITORY } from '../ports/users.repository.token';
import type { UsersRepository, UserProfile, UpdateUserData } from '../ports/users.repository.interface';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: UsersRepository,
  ) {}

  async execute(id: number, data: UpdateUserData): Promise<UserProfile> {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    if (data.email && data.email !== user.email) {
      const conflict = await this.repo.findByEmail(data.email);
      if (conflict) throw new ConflictException('Cet email est déjà utilisé');
    }

    return this.repo.update(id, data);
  }
}
