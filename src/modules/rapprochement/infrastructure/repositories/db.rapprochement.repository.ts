import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  RapprochementRepository,
  ImportReleveData,
  JournalLineCandidate,
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

  async findLigneReleveForUser(ligneId: number, userId: number) {
    const r = await this.prisma.ligneReleve.findFirst({
      where: { id: ligneId, releve: { userId } },
    });
    return r ? this.toLigneEntity(r) : null;
  }

  async findPendingLignesForReleve(releveId: number, userId: number) {
    const releve = await this.prisma.releveImport.findFirst({ where: { id: releveId, userId } });
    if (!releve) return [];
    const rows = await this.prisma.ligneReleve.findMany({
      where: { releveId, rapprochee: false },
      orderBy: { date: 'asc' },
    });
    return rows.map(r => this.toLigneEntity(r));
  }

  async findJournalLinesForMatching(
    userId: number,
    montantAbs: number,
    date: Date,
    toleranceJours: number,
    tolerancePct: number,
  ): Promise<JournalLineCandidate[]> {
    const dateMin = new Date(date.getTime() - toleranceJours * 86_400_000);
    const dateMax = new Date(date.getTime() + toleranceJours * 86_400_000);
    const amtMin  = Math.max(0, Math.floor(montantAbs * (1 - tolerancePct)));
    const amtMax  = Math.ceil(montantAbs * (1 + tolerancePct));

    const rows = await this.prisma.journalLine.findMany({
      where: {
        entry: { userId, date: { gte: dateMin, lte: dateMax } },
        OR: [
          { debit:  { gte: amtMin, lte: amtMax } },
          { credit: { gte: amtMin, lte: amtMax } },
        ],
        lignesReleve: { none: {} },
      },
      include: {
        account: { select: { id: true, code: true, name: true } },
        entry:   { select: { id: true, date: true, label: true, pieceNumber: true } },
      },
      take: 30,
    });

    return rows.map(r => ({
      id:      r.id,
      debit:   r.debit,
      credit:  r.credit,
      account: r.account,
      entry:   { id: r.entry.id, date: r.entry.date, label: r.entry.label, pieceNumber: r.entry.pieceNumber },
    }));
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
