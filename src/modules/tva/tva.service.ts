import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export interface LigneTvaCollectee {
  codeTva: string;
  taux: number;
  label: string;
  baseHt: number;    // centimes
  tvaBrute: number;  // centimes (calculé = crédits sur 44571 dans la période, ventilés par taux)
}

export interface Ca3Report {
  dateFrom: string;
  dateTo: string;
  tvaCollectee: {
    lignes: LigneTvaCollectee[];
    totalBaseHt: number;
    totalTva: number;
  };
  tvaDeductible: {
    surImmobilisations: number;   // débits sur comptes 44562*
    surAutresBiensServices: number; // débits sur comptes 44566*
    total: number;
  };
  soldeTva: number;  // collectée - déductible (positif = TVA à payer)
  tvaAPayer: number;
  creditTva: number;
}

const TVA_CONFIG: Record<string, { taux: number; label: string }> = {
  NORMAL_20:        { taux: 20,  label: 'Taux normal 20 %' },
  INTERMEDIAIRE_10: { taux: 10,  label: 'Taux intermédiaire 10 %' },
  REDUIT_5_5:       { taux: 5.5, label: 'Taux réduit 5,5 %' },
  PARTICULIER_2_1:  { taux: 2.1, label: 'Taux particulier 2,1 %' },
  EXONERE:          { taux: 0,   label: 'Exonéré' },
};

@Injectable()
export class TvaService {
  constructor(private readonly prisma: PrismaService) {}

  async getCa3(userId: number, dateFrom: string, dateTo: string): Promise<Ca3Report> {
    const from = new Date(dateFrom);
    const to   = new Date(dateTo);
    // include full last day
    to.setHours(23, 59, 59, 999);

    // --- Base HT collectée par code TVA ---
    // Seules les lignes en CRÉDIT représentent des ventes (produits 7xx avec codeTva).
    // Les lignes en débit sont des achats (charges 6xx) dont la base figure en déductible.
    const collecteeTaggedLines = await this.prisma.journalLine.findMany({
      where: {
        codeTva: { not: null, in: ['NORMAL_20', 'INTERMEDIAIRE_10', 'REDUIT_5_5', 'PARTICULIER_2_1', 'EXONERE'] },
        entry: { userId, date: { gte: from, lte: to } },
        credit: { gt: 0 }, // uniquement les lignes de vente (crédit sur compte de produit)
      },
    });

    const baseParCode = new Map<string, number>();
    for (const line of collecteeTaggedLines) {
      const code = line.codeTva as string;
      baseParCode.set(code, (baseParCode.get(code) ?? 0) + line.credit);
    }

    // --- TVA collectée : crédits sur comptes 44571* ---
    const collecteeLines = await this.prisma.journalLine.findMany({
      where: {
        account: { userId, code: { startsWith: '44571' } },
        entry: { userId, date: { gte: from, lte: to } },
      },
    });
    const totalCollectee = collecteeLines.reduce((s, l) => s + l.credit, 0);

    // --- TVA déductible immobilisations : débits sur comptes 44562* ---
    const deductImmoLines = await this.prisma.journalLine.findMany({
      where: {
        account: { userId, code: { startsWith: '44562' } },
        entry: { userId, date: { gte: from, lte: to } },
      },
    });
    const totalDeductImmo = deductImmoLines.reduce((s, l) => s + l.debit, 0);

    // --- TVA déductible autres biens et services : débits sur comptes 44566* ---
    const deductServLines = await this.prisma.journalLine.findMany({
      where: {
        account: { userId, code: { startsWith: '44566' } },
        entry: { userId, date: { gte: from, lte: to } },
      },
    });
    const totalDeductServ = deductServLines.reduce((s, l) => s + l.debit, 0);

    // --- Construction des lignes CA3 ---
    const lignes: LigneTvaCollectee[] = Object.entries(TVA_CONFIG).map(([code, cfg]) => {
      const baseHt = baseParCode.get(code) ?? 0;
      // TVA brute calculée depuis le taux (pour EXONERE = 0)
      const tvaBrute = Math.round(baseHt * cfg.taux / 100);
      return { codeTva: code, taux: cfg.taux, label: cfg.label, baseHt, tvaBrute };
    }).filter(l => l.baseHt > 0 || l.codeTva !== 'EXONERE');

    const totalBaseHt = lignes.reduce((s, l) => s + l.baseHt, 0);
    const totalTvaCalculee = lignes.reduce((s, l) => s + l.tvaBrute, 0);

    // Utilise la TVA collectée réelle si disponible, sinon la TVA calculée
    const tvaCollecteeMontant = totalCollectee > 0 ? totalCollectee : totalTvaCalculee;

    const totalDeductible = totalDeductImmo + totalDeductServ;
    const solde = tvaCollecteeMontant - totalDeductible;

    return {
      dateFrom,
      dateTo,
      tvaCollectee: {
        lignes,
        totalBaseHt,
        totalTva: tvaCollecteeMontant,
      },
      tvaDeductible: {
        surImmobilisations: totalDeductImmo,
        surAutresBiensServices: totalDeductServ,
        total: totalDeductible,
      },
      soldeTva: solde,
      tvaAPayer: Math.max(0, solde),
      creditTva: Math.max(0, -solde),
    };
  }
}
