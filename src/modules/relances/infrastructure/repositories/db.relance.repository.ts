import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RelanceRepository } from '../../application/ports/relance.repository.interface';
import { Relance, FactureEnRetard } from '../../domain/entities/relance.entity';

const FACTURE_INCLUDE = {
  tiers: { select: { nom: true, email: true } },
  paiements: { select: { montant: true } },
} as const;

@Injectable()
export class DbRelanceRepository implements RelanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getFacturesEnRetard(userId: number): Promise<FactureEnRetard[]> {
    const now = new Date();
    const rows = await this.prisma.facture.findMany({
      where: {
        userId,
        statut: { in: ['EN_ATTENTE', 'PARTIELLEMENT_PAYEE'] },
        dateEcheance: { lt: now },
      },
      include: {
        ...FACTURE_INCLUDE,
        relances: { select: { id: true } },
      },
      orderBy: { dateEcheance: 'asc' },
    });

    return rows.map(r => {
      const totalPaye = r.paiements.reduce((s, p) => s + p.montant, 0);
      const resteAPayer = Math.max(0, r.montant - totalPaye);
      const joursRetard = Math.max(
        0,
        Math.floor((now.getTime() - r.dateEcheance!.getTime()) / 86_400_000),
      );
      return {
        id: r.id,
        numero: r.numero,
        montant: r.montant,
        resteAPayer,
        dateEcheance: r.dateEcheance!,
        joursRetard,
        tiersId: r.tiersId,
        tiersNom: r.tiers.nom,
        tiersEmail: r.tiers.email,
        niveauRelanceSuivant: r.relances.length + 1,
      };
    });
  }

  async create(
    factureId: number,
    niveau: number,
    note: string | undefined,
    userId: number,
  ): Promise<Relance> {
    const r = await this.prisma.relance.create({
      data: { factureId, niveau, note: note ?? null, userId },
      include: { facture: { include: FACTURE_INCLUDE } },
    });
    return this.toEntity(r);
  }

  async findAll(userId: number, factureId?: number): Promise<Relance[]> {
    const rows = await this.prisma.relance.findMany({
      where: { userId, ...(factureId ? { factureId } : {}) },
      include: { facture: { include: FACTURE_INCLUDE } },
      orderBy: { date: 'desc' },
    });
    return rows.map(r => this.toEntity(r));
  }

  private toEntity(r: any): Relance {
    const totalPaye = (r.facture.paiements ?? []).reduce((s: number, p: any) => s + p.montant, 0);
    return new Relance(
      r.factureId,
      r.niveau,
      r.date,
      r.id,
      r.note ?? undefined,
      r.facture.numero,
      r.facture.montant,
      Math.max(0, r.facture.montant - totalPaye),
      r.facture.dateEcheance ?? undefined,
      r.facture.tiers?.nom ?? undefined,
      r.facture.tiers?.email ?? undefined,
    );
  }
}
