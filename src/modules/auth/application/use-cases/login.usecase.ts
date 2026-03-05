import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AUTH_REPOSITORY } from '../ports/auth.repository.token';
import type { AuthRepository } from '../ports/auth.repository.interface';
import { createHash, randomUUID } from 'crypto';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly repo: AuthRepository,
  ) {}

  async execute(email: string, password: string): Promise<{ access_token: string; user: any }> {
    const user = await this.repo.findByEmail(email);
    if (!user) throw new UnauthorizedException('Email ou mot de passe incorrect');

    const hashed = createHash('sha256').update(password).digest('hex');
    if (user.password !== hashed) throw new UnauthorizedException('Email ou mot de passe incorrect');

    return {
      access_token: randomUUID(),
      user: { id: user.id, name: user.name, email: user.email },
    };
  }
}
