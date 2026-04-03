import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

export interface SetupAdminDto {
  name: string;
  email: string;
  password: string;
}

@Injectable()
export class SetupAdminUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: SetupAdminDto): Promise<{ access_token: string; user: object }> {
    const adminCount = await this.prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount > 0) {
      throw new ForbiddenException('Un compte administrateur existe déjà. Contactez votre administrateur.');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, password: hashed, role: 'ADMIN', isActive: true },
    });

    const access_token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });

    return {
      access_token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }
}
