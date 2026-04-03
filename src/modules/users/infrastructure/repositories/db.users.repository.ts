import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'src/common/enums/role.enum';
import type { UsersRepository, UserProfile, CreateUserData, UpdateUserData } from '../../application/ports/users.repository.interface';

function toProfile(row: any): UserProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as Role,
    isActive: row.isActive,
  };
}

@Injectable()
export class DbUsersRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<UserProfile[]> {
    const rows = await this.prisma.user.findMany({ orderBy: { id: 'asc' } });
    return rows.map(toProfile);
  }

  async findById(id: number): Promise<UserProfile | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? toProfile(row) : null;
  }

  async findByEmail(email: string): Promise<UserProfile | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? toProfile(row) : null;
  }

  async create(data: CreateUserData): Promise<UserProfile> {
    const row = await this.prisma.user.create({
      data: { name: data.name, email: data.email, password: data.password, role: data.role },
    });
    return toProfile(row);
  }

  async update(id: number, data: UpdateUserData): Promise<UserProfile> {
    const row = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.role !== undefined && { role: data.role }),
      },
    });
    return toProfile(row);
  }

  async setActive(id: number, isActive: boolean): Promise<UserProfile> {
    const row = await this.prisma.user.update({ where: { id }, data: { isActive } });
    return toProfile(row);
  }

  async countByRole(role: Role): Promise<number> {
    return this.prisma.user.count({ where: { role, isActive: true } });
  }
}
