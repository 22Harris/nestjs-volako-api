import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  RapprochementRepository,
  ImportReleveData,
} from '../../application/ports/rapprochement.repository.interface';
import { ReleveImport } from '../../domain/entities/releve-import.entity';
import { LigneReleve } from '../../domain/entities/ligne-releve.entity';

@Injectable()
export class DbRapprochementRepository implements RapprochementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createReleve(data: ImportReleveData, userId: number) {
    const releve = await this.prisma.releveImport.create({
      data: {
        nom:        data.nom,
        dateDebut:  data.dateDebut  ?? null,
        dateFin:    data.dateFin    ?? null,
        soldeDebut: data.soldeDebut ?? null,
        soldeFin:   data.soldeFin   ?? null,
        userId,
        lignes: {
          create: data.lignes.map(l => ({
            date:      l.date,
            libelle:   l.libelle,
            montant:   l.montant,
            reference: l.reference ?? null,
          })),
        },
      },
      include: { lignes: { orderBy: { date: 'asc' } } },
    });
    return this.toReleveWithLignes(releve);
  }

  async findReleves(userId: number) {
    const releves = await this.prisma.releveImport.findMany({
      where: { userId },
      include: { lignes: { orderBy: { date: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return releves.map(r => this.toReleveWithLignes(r));
  }

  async findReleve(id: number, userId: number) {
    const releve = await this.prisma.releveImport.findFirst({
      where: { id, userId },
      include: {
        lignes: {
          orderBy: { date: 'asc' },
          include: {
            journalLine: {
              include: { account: true, entry: true },
            },
          },
        },
      },
    });
    if (!releve) return null;
    return this.toReleveWithLignes(releve);
  }

  async deleteReleve(id: number, userId: number) {
    await this.prisma.releveImport.deleteMany({ where: { id, userId } });
  }

  async rapprocherLigne(ligneId: number, journalLineId: number) {
    const r = await this.prisma.ligneReleve.update({
      where: { id: ligneId },
      data: { rapprochee: true, journalLineId },
    });
    return this.toLigneEntity(r);
  }

  async derapprocherLigne(ligneId: number) {
    const r = await this.prisma.ligneReleve.update({
      where: { id: ligneId },
      data: { rapprochee: false, journalLineId: null },
    });
    return this.toLigneEntity(r);
  }

  async findLigneReleve(ligneId: number) {
    const r = await this.prisma.ligneReleve.findUnique({ where: { id: ligneId } });
    return r ? this.toLigneEntity(r) : null;
  }

  // ── Mappers ────────────────────────────────────────────────────────────────

  private toReleveEntity(r: any): ReleveImport {
    return new ReleveImport(r.nom, r.dateDebut, r.dateFin, r.soldeDebut, r.soldeFin, r.id, r.createdAt);
  }

  private toLigneEntity(r: any): LigneReleve {
    return new LigneReleve(
      r.releveId, r.date, r.libelle, r.montant,
      r.reference, r.rapprochee, r.journalLineId, r.id,
    );
  }

  private toReleveWithLignes(r: any) {
    return {
      ...this.toReleveEntity(r),
      lignes: (r.lignes ?? []).map((l: any) => ({
        ...this.toLigneEntity(l),
        journalLine: l.journalLine
          ? {
              id:        l.journalLine.id,
              debit:     l.journalLine.debit,
              credit:    l.journalLine.credit,
              accountId: l.journalLine.accountId,
              entryId:   l.journalLine.entryId,
              account:   l.journalLine.account
                ? { id: l.journalLine.account.id, code: l.journalLine.account.code, name: l.journalLine.account.name }
                : null,
              entry: l.journalLine.entry
                ? { id: l.journalLine.entry.id, date: l.journalLine.entry.date, label: l.journalLine.entry.label }
                : null,
            }
          : null,
      })),
    };
  }
}
