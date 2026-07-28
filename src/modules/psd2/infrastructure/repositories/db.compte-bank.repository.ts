import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { CompteBankRepository, CreateCompteBankData } from '../../application/ports/compte-bank.repository.interface';
import { CompteBank } from '../../domain/entities/compte-bank.entity';
import type { CompteBank as PrismaCompteBank } from '@prisma/client';

function toEntity(r: PrismaCompteBank): CompteBank {
  return new CompteBank(
    r.nom,
    r.iban,
    r.provider,
    r.accessToken,
    r.actif,
    r.refreshToken ?? undefined,
    r.tokenExpiresAt ?? undefined,
    r.derniereSync ?? undefined,
    r.id,
    r.userId,
  );
}

@Injectable()
export class DbCompteBankRepository implements CompteBankRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCompteBankData, userId: number): Promise<CompteBank> {
    const r = await this.prisma.compteBank.create({
      data: {
        nom:           data.nom,
        iban:          data.iban,
        provider:      data.provider,
        accessToken:   data.accessToken,
        refreshToken:  data.refreshToken,
        tokenExpiresAt: data.tokenExpiresAt,
        userId,
      },
    });
    return toEntity(r);
  }

  async findAll(userId: number): Promise<CompteBank[]> {
    const rows = await this.prisma.compteBank.findMany({
      where: { userId, actif: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toEntity);
  }

  async findById(id: number, userId: number): Promise<CompteBank | null> {
    const r = await this.prisma.compteBank.findFirst({ where: { id, userId } });
    return r ? toEntity(r) : null;
  }

  async updateTokens(id: number, accessToken: string, refreshToken?: string, tokenExpiresAt?: Date): Promise<void> {
    await this.prisma.compteBank.update({
      where: { id },
      data: { accessToken, refreshToken, tokenExpiresAt },
    });
  }

  async updateDerniereSync(id: number, date: Date): Promise<void> {
    await this.prisma.compteBank.update({ where: { id }, data: { derniereSync: date } });
  }

  async delete(id: number, userId: number): Promise<void> {
    await this.prisma.compteBank.update({ where: { id, userId }, data: { actif: false } });
  }
}
