import { Injectable } from '@nestjs/common';
import { AuthRepository, RefreshTokenData } from '../../application/ports/auth.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'src/common/enums/role.enum';

@Injectable()
export class DbAuthRepository implements AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toUser(row: any): User {
    return new User(row.name, row.email, row.password, row.id, row.role as Role, row.isActive, row.twoFactorSecret ?? undefined, row.twoFactorEnabled);
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? this.toUser(row) : null;
  }

  async findById(id: number): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toUser(row) : null;
  }

  async create(user: User): Promise<User> {
    const row = await this.prisma.user.create({
      data: { name: user.name, email: user.email, password: user.password },
    });
    return this.toUser(row);
  }

  async updateProfile(id: number, name: string, email: string): Promise<User> {
    const row = await this.prisma.user.update({ where: { id }, data: { name, email } });
    return this.toUser(row);
  }

  async updatePassword(id: number, hashedPassword: string): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { password: hashedPassword } });
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

  async setTwoFactorSecret(userId: number, secret: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret, twoFactorEnabled: false } });
  }

  async enableTwoFactor(userId: number): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
  }

  async disableTwoFactor(userId: number): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: false, twoFactorSecret: null } });
  }
}
