import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ExporterDonneesPersonnellesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    if (!user) throw new NotFoundException(`Utilisateur #${userId} introuvable`);

    const [tiers, factures, operations, immobilisations, companyInfo, relances, centresAnalytique] =
      await Promise.all([
        this.prisma.tiers.findMany({
          where: { userId },
          select: { id: true, nom: true, type: true, siret: true, email: true, telephone: true, adresse: true },
        }),
        this.prisma.facture.findMany({
          where: { userId },
          select: {
            id: true, numero: true, date: true, dateEcheance: true,
            montant: true, statut: true, notes: true,
            tiers: { select: { nom: true } },
          },
          orderBy: { date: 'desc' },
          take: 200,
        }),
        this.prisma.operation.findMany({
          where: { userId },
          select: { id: true, type: true, date: true, label: true, amount: true },
          orderBy: { date: 'desc' },
          take: 200,
        }),
        this.prisma.immobilisation.findMany({
          where: { userId },
          select: { id: true, libelle: true, dateAcquisition: true, valeurBrute: true, statut: true },
        }),
        this.prisma.companyInfo.findUnique({
          where: { userId },
          select: { nom: true, siret: true, numTva: true, adresse: true, email: true },
        }),
        this.prisma.relance.findMany({
          where: { userId },
          select: { id: true, niveau: true, date: true, facture: { select: { numero: true } } },
          orderBy: { date: 'desc' },
          take: 100,
        }),
        this.prisma.centreAnalytique.findMany({
          where: { userId },
          select: { id: true, code: true, libelle: true },
        }),
      ]);

    return {
      exportDate: new Date().toISOString(),
      userId,
      profil: user,
      companyInfo: companyInfo ?? null,
      tiers,
      factures,
      operations,
      immobilisations,
      relances,
      centresAnalytique,
    };
  }
}
