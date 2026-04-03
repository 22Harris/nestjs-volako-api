import { Injectable } from '@nestjs/common';
import { AuthRepository, RefreshTokenData } from '../../application/ports/auth.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'src/common/enums/role.enum';

@Injectable()
export class DbAuthRepository implements AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? new User(row.name, row.email, row.password, row.id, row.role as Role, row.isActive) : null;
  }

  async findById(id: number): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? new User(row.name, row.email, row.password, row.id, row.role as Role, row.isActive) : null;
  }

  async create(user: User): Promise<User> {
    const row = await this.prisma.user.create({
      data: { name: user.name, email: user.email, password: user.password },
    });
    return new User(row.name, row.email, row.password, row.id, row.role as Role, row.isActive);
  }

  async createRefreshToken(userId: number, token: string, expiresAt: Date): Promise<void> {
    await this.prisma.refreshToken.create({ data: { userId, token, expiresAt } });
  }

  async findRefreshToken(token: string): Promise<RefreshTokenData | null> {
    const row = await this.prisma.refreshToken.findUnique({ where: { token } });
    return row ? { id: row.id, token: row.token, userId: row.userId, expiresAt: row.expiresAt } : null;
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.delete({ where: { token } });
  }
}
