import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { AUTH_REPOSITORY } from '../ports/auth.repository.token';
import type { AuthRepository } from '../ports/auth.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { createHash, randomUUID } from 'crypto';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly repo: AuthRepository,
  ) {}

  async execute(name: string, email: string, password: string): Promise<{ access_token: string; user: any }> {
    const existing = await this.repo.findByEmail(email);
    if (existing) throw new ConflictException('Cet email est déjà utilisé');

    const hashed = createHash('sha256').update(password).digest('hex');
    const user = await this.repo.create(new User(name, email, hashed));

    return {
      access_token: randomUUID(),
      user: { id: user.id, name: user.name, email: user.email },
    };
  }
}
