import { Injectable } from '@nestjs/common';
import { PeriodeLocksRepository } from '../../application/ports/periode-locks.repository.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { PeriodeLock } from '../../domain/entities/periode-lock.entity';

@Injectable()
export class DbPeriodeLocksRepository implements PeriodeLocksRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(row: any): PeriodeLock {
    return new PeriodeLock(row.annee, row.mois, row.userId, row.lockedAt, row.id);
  }

  findAll(userId: number): Promise<PeriodeLock[]> {
    return this.prisma.periodeLock
      .findMany({ where: { userId }, orderBy: [{ annee: 'desc' }, { mois: 'desc' }] })
      .then((rows) => rows.map((r) => this.toEntity(r)));
  }

  async isLocked(annee: number, mois: number, userId: number): Promise<boolean> {
    const row = await this.prisma.periodeLock.findUnique({
      where: { annee_mois_userId: { annee, mois, userId } },
    });
    return !!row;
  }

  lock(annee: number, mois: number, userId: number): Promise<PeriodeLock> {
    return this.prisma.periodeLock
      .create({ data: { annee, mois, userId } })
      .then((r) => this.toEntity(r));
  }

  async unlock(id: number, userId: number): Promise<void> {
    await this.prisma.periodeLock.deleteMany({ where: { id, userId } });
  }
}
