import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { AnalytiqueRepository } from '../../application/ports/analytique.repository.interface';
import {
  CentreAnalytique,
  AffectationLigne,
  LigneAnalytique,
  BalanceCentre,
} from '../../domain/entities/centre-analytique.entity';

@Injectable()
export class DbAnalytiqueRepository implements AnalytiqueRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── CentreAnalytique CRUD ────────────────────────────────────────────────

  async createCentre(code: string, libelle: string, userId: number): Promise<CentreAnalytique> {
    const r = await this.prisma.centreAnalytique.create({ data: { code, libelle, userId } });
    return new CentreAnalytique(r.code, r.libelle, r.userId, r.id);
  }

  async findAllCentres(userId: number): Promise<CentreAnalytique[]> {
    const rows = await this.prisma.centreAnalytique.findMany({
      where: { userId },
      orderBy: { code: 'asc' },
    });
    return rows.map(r => new CentreAnalytique(r.code, r.libelle, r.userId, r.id));
  }

  async findCentreById(id: number, userId: number): Promise<CentreAnalytique | null> {
    const r = await this.prisma.centreAnalytique.findFirst({ where: { id, userId } });
    return r ? new CentreAnalytique(r.code, r.libelle, r.userId, r.id) : null;
  }

  async updateCentre(id: number, code: string, libelle: string, _userId: number): Promise<CentreAnalytique> {
    const r = await this.prisma.centreAnalytique.update({ where: { id }, data: { code, libelle } });
    return new CentreAnalytique(r.code, r.libelle, r.userId, r.id);
  }

  async deleteCentre(id: number, _userId: number): Promise<void> {
    await this.prisma.centreAnalytique.delete({ where: { id } });
  }

  // ── Affectations ─────────────────────────────────────────────────────────

  async affecter(journalLineId: number, affectations: AffectationLigne[]): Promise<LigneAnalytique[]> {
    // Remplace les affectations existantes pour cette ligne
    await this.prisma.ligneAnalytique.deleteMany({ where: { journalLineId } });
    await this.prisma.ligneAnalytique.createMany({
      data: affectations.map(a => ({ journalLineId, centreId: a.centreId, pourcentage: a.pourcentage })),
    });
    return this.getAffectations(journalLineId);
  }

  async getAffectations(journalLineId: number): Promise<LigneAnalytique[]> {
    const rows = await this.prisma.ligneAnalytique.findMany({
      where: { journalLineId },
      include: { centre: { select: { code: true, libelle: true } } },
    });
    return rows.map(r => ({
      id: r.id,
      journalLineId: r.journalLineId,
      centreId: r.centreId,
      pourcentage: r.pourcentage,
      centreCode: r.centre.code,
      centreLibelle: r.centre.libelle,
    }));
  }

  // ── Balance analytique ───────────────────────────────────────────────────

  async getBalance(userId: number, dateFrom?: Date, dateTo?: Date): Promise<BalanceCentre[]> {
    const lignes = await this.prisma.ligneAnalytique.findMany({
      where: {
        journalLine: {
          entry: {
            userId,
            statut: { in: ['VALIDE', 'VERROUILLE'] },
            ...(dateFrom || dateTo
              ? {
                  date: {
                    ...(dateFrom ? { gte: dateFrom } : {}),
                    ...(dateTo ? { lte: dateTo } : {}),
                  },
                }
              : {}),
          },
        },
      },
      include: {
        journalLine: { select: { debit: true, credit: true } },
        centre: true,
      },
    });

    const acc = new Map<number, { centre: CentreAnalytique; debit: number; credit: number }>();
    for (const l of lignes) {
      const d = Math.round((l.journalLine.debit * l.pourcentage) / 100);
      const c = Math.round((l.journalLine.credit * l.pourcentage) / 100);
      if (!acc.has(l.centreId)) {
        acc.set(l.centreId, {
          centre: new CentreAnalytique(l.centre.code, l.centre.libelle, l.centre.userId, l.centre.id),
          debit: 0,
          credit: 0,
        });
      }
      const entry = acc.get(l.centreId)!;
      entry.debit += d;
      entry.credit += c;
    }

    return [...acc.values()].map(e => ({
      ...e,
      solde: e.debit - e.credit,
    }));
  }
}
