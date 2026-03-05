import { Injectable } from '@nestjs/common';
import { AuthRepository } from '../../application/ports/auth.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DbAuthRepository implements AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? new User(row.name, row.email, row.password, row.id) : null;
  }

  async create(user: User): Promise<User> {
    const row = await this.prisma.user.create({
      data: { name: user.name, email: user.email, password: user.password },
    });
    return new User(row.name, row.email, row.password, row.id);
  }
}
