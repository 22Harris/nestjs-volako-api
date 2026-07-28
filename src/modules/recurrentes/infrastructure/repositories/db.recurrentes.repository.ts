import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { RecurrentesRepository, CreateRecurrenteData, UpdateRecurrenteData } from '../../application/ports/recurrentes.repository.interface';
import { EcritureRecurrente } from '../../domain/entities/ecriture-recurrente.entity';
import type { LigneRecurrenteData } from '../../domain/entities/ecriture-recurrente.entity';
import type { Prisma } from '@prisma/client';

type RecurrenteWithLignes = Prisma.EcritureRecurrenteGetPayload<{ include: { lignes: true } }>;

function toEntity(r: RecurrenteWithLignes): EcritureRecurrente {
  const lignes: LigneRecurrenteData[] = r.lignes.map(l => ({
    id: l.id,
    accountId: l.accountId,
    debit: l.debit,
    credit: l.credit,
    codeTva: l.codeTva ?? undefined,
  }));
  return new EcritureRecurrente(
    r.label,
    r.frequence,
    r.prochainExecution,
    lignes,
    r.actif,
    r.journalId ?? undefined,
    r.id,
    r.userId,
  );
}

@Injectable()
export class DbRecurrentesRepository implements RecurrentesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRecurrenteData, userId: number): Promise<EcritureRecurrente> {
    const r = await this.prisma.ecritureRecurrente.create({
      data: {
        label:             data.label,
        frequence:         data.frequence,
        prochainExecution: data.prochainExecution,
        actif:             data.actif ?? true,
        journalId:         data.journalId,
        userId,
        lignes: { create: data.lignes.map(l => ({ accountId: l.accountId, debit: l.debit, credit: l.credit, codeTva: l.codeTva })) },
      },
      include: { lignes: true },
    });
    return toEntity(r);
  }

  async findAll(userId: number): Promise<EcritureRecurrente[]> {
    const rows = await this.prisma.ecritureRecurrente.findMany({
      where: { userId },
      include: { lignes: true },
      orderBy: { prochainExecution: 'asc' },
    });
    return rows.map(toEntity);
  }

  async findById(id: number, userId: number): Promise<EcritureRecurrente | null> {
    const r = await this.prisma.ecritureRecurrente.findFirst({
      where: { id, userId },
      include: { lignes: true },
    });
    return r ? toEntity(r) : null;
  }

  async update(id: number, data: UpdateRecurrenteData, userId: number): Promise<EcritureRecurrente> {
    // Replace lignes when provided
    if (data.lignes) {
      await this.prisma.ligneRecurrente.deleteMany({ where: { ecritureId: id } });
    }
    const r = await this.prisma.ecritureRecurrente.update({
      where: { id, userId },
      data: {
        ...(data.label             !== undefined && { label: data.label }),
        ...(data.frequence         !== undefined && { frequence: data.frequence }),
        ...(data.prochainExecution !== undefined && { prochainExecution: data.prochainExecution }),
        ...(data.actif             !== undefined && { actif: data.actif }),
        ...(data.journalId         !== undefined && { journalId: data.journalId }),
        ...(data.lignes && {
          lignes: { create: data.lignes.map(l => ({ accountId: l.accountId, debit: l.debit, credit: l.credit, codeTva: l.codeTva })) },
        }),
      },
      include: { lignes: true },
    });
    return toEntity(r);
  }

  async delete(id: number, userId: number): Promise<void> {
    await this.prisma.ecritureRecurrente.delete({ where: { id, userId } });
  }

  async findDues(): Promise<EcritureRecurrente[]> {
    const rows = await this.prisma.ecritureRecurrente.findMany({
      where: { actif: true, prochainExecution: { lte: new Date() } },
      include: { lignes: true },
    });
    return rows.map(toEntity);
  }

  async updateNextExecution(id: number, next: Date): Promise<void> {
    await this.prisma.ecritureRecurrente.update({
      where: { id },
      data: { prochainExecution: next },
    });
  }
}
