import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { AUTH_REPOSITORY } from '../ports/auth.repository.token';
import type { AuthRepository } from '../ports/auth.repository.interface';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../domain/entities/user.entity';
import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { AuditLogService } from 'src/common/audit-log/audit-log.service';
import { InitPcgUseCase } from 'src/modules/accounts/application/use-cases/init_pcg.usecase';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly repo: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly auditLog: AuditLogService,
    private readonly initPcgUseCase: InitPcgUseCase,
  ) {}

  async execute(
    name: string,
    email: string,
    password: string,
    ip?: string,
  ): Promise<{ access_token: string; refresh_token: string; user: any }> {
    const existing = await this.repo.findByEmail(email);
    if (existing) throw new ConflictException('Cet email est déjà utilisé');

    const hashed = await bcrypt.hash(password, 12);
    const user = await this.repo.create(new User(name, email, hashed));

    await this.initPcgUseCase.execute(user.id!);

    const access_token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role, isActive: user.isActive });

    const refresh_token = randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.repo.createRefreshToken(user.id!, refresh_token, expiresAt);

    await this.auditLog.log({ userId: user.id, action: 'REGISTER', ip });

    return {
      access_token,
      refresh_token,
      user: { id: user.id, name: user.name, email: user.email },
    };
  }
}
