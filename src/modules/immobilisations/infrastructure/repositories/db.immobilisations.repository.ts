import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ImmobilisationsRepository } from '../../application/ports/immobilisations.repository.interface';
import { Immobilisation, LigneAmortissement, MethodeAmortissement, StatutImmobilisation } from '../../domain/entities/immobilisation.entity';

@Injectable()
export class DbImmobilisationsRepository implements ImmobilisationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(row: any): Immobilisation {
    return new Immobilisation(
      row.libelle,
      row.dateAcquisition,
      row.valeurBrute,
      row.dureeAmortissement,
      row.methode as MethodeAmortissement,
      row.compteBilanCode,
      row.compteAmortissementCode,
      row.compteChargeCode,
      row.statut as StatutImmobilisation,
      (row.lignes ?? []).map((l: any) => new LigneAmortissement(
        l.exercice,
        l.dotation,
        l.cumulAmortissement,
        l.valeurNetteComptable,
        l.comptabilisee,
        l.id,
        l.journalEntryId ?? undefined,
      )),
      row.id,
      row.userId,
      row.dateCession ?? undefined,
      row.prixCession ?? undefined,
    );
  }

  async create(immo: Immobilisation, userId: number): Promise<Immobilisation> {
    const row = await this.prisma.immobilisation.create({
      data: {
        libelle: immo.libelle,
        dateAcquisition: immo.dateAcquisition,
        valeurBrute: immo.valeurBrute,
        dureeAmortissement: immo.dureeAmortissement,
        methode: immo.methode,
        compteBilanCode: immo.compteBilanCode,
        compteAmortissementCode: immo.compteAmortissementCode,
        compteChargeCode: immo.compteChargeCode,
        statut: 'ACTIF',
        userId,
        lignes: {
          create: immo.lignes.map(l => ({
            exercice: l.exercice,
            dotation: l.dotation,
            cumulAmortissement: l.cumulAmortissement,
            valeurNetteComptable: l.valeurNetteComptable,
          })),
        },
      },
      include: { lignes: { orderBy: { exercice: 'asc' } } },
    });
    return this.toEntity(row);
  }

  async findAll(userId: number): Promise<Immobilisation[]> {
    const rows = await this.prisma.immobilisation.findMany({
      where: { userId },
      include: { lignes: { orderBy: { exercice: 'asc' } } },
      orderBy: { dateAcquisition: 'desc' },
    });
    return rows.map(r => this.toEntity(r));
  }

  async findById(id: number, userId: number): Promise<Immobilisation | null> {
    const row = await this.prisma.immobilisation.findFirst({
      where: { id, userId },
      include: { lignes: { orderBy: { exercice: 'asc' } } },
    });
    if (!row) return null;
    return this.toEntity(row);
  }

  async setStatutCede(id: number, dateCession: Date, prixCession: number, userId: number): Promise<void> {
    await this.prisma.immobilisation.update({
      where: { id, userId },
      data: { statut: 'CEDE', dateCession, prixCession },
    });
  }

  async delete(id: number, userId: number): Promise<void> {
    await this.prisma.immobilisation.delete({ where: { id, userId } });
  }

  async markDotationComptabilisee(immobilisationId: number, exercice: number, journalEntryId: number): Promise<void> {
    await this.prisma.ligneAmortissement.update({
      where: { immobilisationId_exercice: { immobilisationId, exercice } },
      data: { comptabilisee: true, journalEntryId },
    });
  }
}
