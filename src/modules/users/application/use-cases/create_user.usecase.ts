import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { USERS_REPOSITORY } from '../ports/users.repository.token';
import type { UsersRepository, UserProfile } from '../ports/users.repository.interface';
import { Role } from 'src/common/enums/role.enum';
import * as bcrypt from 'bcrypt';

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: Role;
}

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: UsersRepository,
  ) {}

  async execute(dto: CreateUserDto): Promise<UserProfile> {
    const existing = await this.repo.findByEmail(dto.email);
    if (existing) throw new ConflictException('Un utilisateur avec cet email existe déjà');

    const hashed = await bcrypt.hash(dto.password, 10);
    return this.repo.create({ name: dto.name, email: dto.email, password: hashed, role: dto.role });
  }
}
